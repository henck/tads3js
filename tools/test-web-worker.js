// Test the browser worker bundle (web/tads3js-worker.js) under Node: run it in
// a worker thread and play the page's part of the protocol (see
// src/web/protocol.ts), answering input from a script.
// usage: node tools/test-web-worker.js game.t3 script.txt
//   script lines: a command, or "!save NAME" / "!restore NAME" (the next file
//   dialog's answer; the saved file is kept in memory here, like the page's store).
// Key presses are answered with Enter. The random number generator isn't seeded (like t3run -norand).
const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

const [image, scriptFile] = process.argv.slice(2);
const script = fs.readFileSync(scriptFile, 'utf8').split(/\r?\n/).filter((l) => l !== '');
const HEADER = 16, SIZE = 32 * 1024 * 1024;

// The worker expects a browser worker's globals.
const prelude = `
  const { parentPort } = require('worker_threads');
  globalThis.self = globalThis;
  globalThis.postMessage = (m, t) => parentPort.postMessage(m, t);
  parentPort.on('message', (data) => self.onmessage({ data }));
  require(${JSON.stringify(path.join(__dirname, '../web/tads3js-worker.js'))});
`;
const worker = new Worker(prelude, { eval: true });
const shared = new SharedArrayBuffer(SIZE);
const control = new Int32Array(shared, 0, 4), bytes = new Uint8Array(shared, HEADER);
const saved = new Map();
let pendingFile = null;

function reply(kind, text = '', data) {
  let t = new TextEncoder().encode(text);
  bytes.set(t, 0);
  if(data) bytes.set(data, t.length);
  control[1] = kind; control[2] = t.length; control[3] = data ? data.length : 0;
  Atomics.store(control, 0, 1);
  Atomics.notify(control, 0);
}

worker.on('message', (msg) => {
  switch(msg.type) {
    case 'output': process.stdout.write(msg.text); break;
    case 'status': break;
    case 'input': {
      if(msg.kind != 'line') { reply(2, '\n'); break; }   // (press Enter)
      let line = script.shift();
      while(line && line.startsWith('!')) { pendingFile = line.split(' ')[1]; line = script.shift(); }
      if(line === undefined) { reply(0); break; }
      process.stdout.write(line + '\n');
      reply(msg.kind == 'line' ? 1 : 2, msg.kind == 'line' ? line : (line[0] || '\n'));
      break;
    }
    case 'askFile': {
      let name = pendingFile || '';
      pendingFile = null;
      process.stdout.write(`[file dialog: ${msg.save ? 'save' : 'open'} -> ${name}]\n`);
      reply(3, name, msg.save ? undefined : saved.get(name));
      break;
    }
    case 'fileWritten':
      saved.set(msg.name, msg.data);
      process.stdout.write(`[file written: ${msg.name}, ${msg.data.length} bytes]\n`);
      break;
    case 'end': process.stdout.write('\n[end]\n'); worker.terminate(); break;
    case 'error': process.stdout.write('\n[error] ' + msg.message + '\n'); worker.terminate(); process.exitCode = 1; break;
  }
});
worker.on('error', (e) => { console.error(e); process.exitCode = 1; });
worker.postMessage({ type: 'start', norand: true, shared, image: new Uint8Array(fs.readFileSync(image)) });
