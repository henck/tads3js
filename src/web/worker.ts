import { Vm } from '../Vm';
import { Debug } from '../Debug';
import { Platform, memoryPlatform } from '../Platform';
import { GameHost, GameFileSystem, Reply } from './GameHost';
import * as P from './protocol';

/*
 * The web worker that runs the VM (when the page is cross-origin isolated,
 * so SharedArrayBuffer is available). The VM is synchronous, so waiting for
 * input blocks the worker (Atomics.wait) until the page writes the reply to
 * the shared buffer.
 */

const post = (msg: P.WorkerMessage, transfer?: Transferable[]) => (self as any).postMessage(msg, transfer || []);

self.onmessage = (e: MessageEvent) => {
  let msg = e.data as P.StartMessage;
  if(msg.type != 'start') return;
  Debug.SHOW = false;

  let control = new Int32Array(msg.shared, 0, 4);
  let bytes = new Uint8Array(msg.shared, P.HEADER_BYTES);
  const wait = (request: P.WorkerMessage): Reply => {
    Atomics.store(control, 0, 0);
    post(request);
    Atomics.wait(control, 0, 0);
    let kind = control[1], textLength = control[2], dataLength = control[3];
    // (TextDecoder can't decode from a shared buffer directly.)
    let text = new TextDecoder().decode(bytes.slice(0, textLength));
    let data = bytes.slice(textLength, textLength + dataLength);
    return { kind: kind, text: text, data: data };
  };
  const delay = (ms: number) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

  let fs = new GameFileSystem(post);
  Platform.set(memoryPlatform(fs));
  let host = new GameHost(post, fs, wait, delay);
  let vm = Vm.getInstance();
  host.html = !!msg.html;
  vm.host = host;
  if(msg.norand) vm.randomSeed = false;
  try {
    vm.loadImage(msg.image);
    if(msg.script) vm.console.input.pushScript(msg.script);
    vm.run();
    host.flush();
    post({ type: 'end' });
  } catch(ex) {
    host.flush();
    post({ type: 'error', message: ex instanceof Error ? ex.message : String(ex) });
    console.error(ex);
  }
};
