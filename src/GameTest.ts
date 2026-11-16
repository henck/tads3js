const colors = require('colors');
const execSync = require('child_process').execSync;
import * as fs from 'fs';
import * as path from 'path';
import { Vm } from './Vm';
import { Debug } from './Debug';
import { BufferHost, InputPending } from './io/Host';

/**
 * A host that gives the script's command lines itself, pausing the VM at
 * each request first (as a web page's host does): tests pausing and
 * resuming. Commands are echoed like the script player does.
 */
class PausingHost extends BufferHost {
  private ready = false;
  public pauses = 0;
  constructor(private lines: string[]) { super(); }
  private pause() {
    if(!this.ready) {
      this.ready = true;
      this.pauses++;
      throw new InputPending();
    }
    this.ready = false;
  }
  readLine(): string | null {
    this.pause();
    if(!this.lines.length) return null;
    let line = this.lines.shift();
    this.output += line + '\n';
    return line;
  }
  readKey(): string | null {
    this.pause();
    return null;
  }
  // (Like the script player: file dialogs aren't answered from command lines.)
  askFile(prompt: string): string | null {
    this.pause();
    this.output += prompt + ' >';
    return null;
  }
}

/*
 * Game tests: each directory in games/ holds a game (game.t, built with
 * game.t3m; or just a compiled image, *.t3, for a game we don't have the
 * source of), a command script (game.in) and the transcript the reference
 * interpreter produces for it (game.out, with t3run -norand, so random
 * events are the same each time). We build the game, play the script, and
 * compare transcripts. (If the directory has a compare.txt saying
 * "ignore-spacing", whitespace is ignored in the comparison: for games
 * whose layout we don't reproduce exactly.) compare.txt may also say
 * "html": play the game in HTML mode (IHost.html: images, banners), and
 * "fixed-clock": use a make-believe clock (Vm.fixedClock), for games whose
 * behaviour depends on the time; "no-oracle": the reference interpreter can't play the game (e.g. an
 * HTML TADS game), so --record records game.out with our VM instead,
 * after the transcript has been checked by hand. A line "clean: files..."
 * lists files the game leaves behind, to delete before each run.
 *
 * Command line: node build/GameTest.js [--record] [--pause] [filter]
 *   --record  record game.out by playing the script on the reference
 *             interpreter (t3run), instead of testing our VM.
 *   --pause   the host gives the commands, pausing the VM at each request
 *             (as in a web page without a worker): tests vm.resume().
 */
Debug.SHOW = false;
const T3MAKE = process.env.T3MAKE ?? 'C:\\Program Files (x86)\\TADS 3\\t3make.exe';
const T3RUN = process.env.T3RUN ?? T3MAKE.replace(/t3make\.exe$/i, 't3run.exe');
const ARGS = process.argv.slice(2);
const RECORD = ARGS.includes('--record');
const PAUSE = ARGS.includes('--pause');
const FILTER = ARGS.filter((a) => !a.startsWith('--'))[0];

let failed = 0, passed = 0;
for(let name of fs.readdirSync('games')) {
  let dir = path.join('games', name);
  if(!fs.statSync(dir).isDirectory() || (FILTER && !name.includes(FILTER))) continue;
  let image = 'game.t3';
  if(!fs.existsSync(path.join(dir, 'game.t3m'))) {
    // A compiled game (images aren't in the repository: skip it if absent).
    image = fs.readdirSync(dir).find((f) => f.endsWith('.t3'));
    if(!image || !fs.existsSync(path.join(dir, 'game.in'))) continue;
  }
  process.stdout.write(name.padEnd(20));
  if(image == 'game.t3') {
    try {
      fs.mkdirSync(path.join(dir, 'obj'), { recursive: true });
      execSync(`"${T3MAKE}" -f game.t3m`, { cwd: dir, stdio: 'pipe' });
    } catch(ex) {
      console.log(colors.yellow('compile error'));
      console.log(String(ex.stdout ?? ex));
      failed++;
      continue;
    }
  }
  let script = fs.readFileSync(path.join(dir, 'game.in'), 'utf8');
  let options = fs.existsSync(path.join(dir, 'compare.txt')) ? fs.readFileSync(path.join(dir, 'compare.txt'), 'utf8') : '';
  let noOracle = options.includes('no-oracle');
  // "clean: a.sav b.txt": files the game leaves behind (e.g. achievements
  // it remembers between plays), deleted before each run.
  let clean = /^clean:(.*)$/m.exec(options);
  if(clean) for(let f of clean[1].trim().split(/\s+/)) {
    if(fs.existsSync(path.join(dir, f))) fs.unlinkSync(path.join(dir, f));
  }
  if(PAUSE && script.startsWith('<eventscript>')) {
    console.log(colors.yellow('skipped') + ' (event script)');
    continue;
  }

  if(RECORD && !noOracle) {
    // t3run's output is lost when stdout is a pipe, so redirect to a file.
    execSync(`"${T3RUN}" -plain -norand -cs utf-8 -I game.in ${image} > game.out`, { cwd: dir, stdio: 'pipe', timeout: 600000 });
    let out = fs.readFileSync(path.join(dir, 'game.out'), 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(path.join(dir, 'game.out'), out);
    console.log('recorded');
    continue;
  }

  let host = PAUSE
    ? new PausingHost(script.split(/\r?\n/).filter((l) => l.startsWith('>')).map((l) => l.substr(1)))
    : new BufferHost();
  host.html = options.includes('html');
  let cwd = process.cwd();
  let start = Date.now();
  try {
    // Run in the game's directory, so files it saves go there.
    process.chdir(dir);
    Vm.getInstance().host = host;
    Vm.getInstance().randomSeed = false;   // (as t3run -norand)
    Vm.getInstance().fixedClock = options.includes('fixed-clock');
    Vm.getInstance().load(image);
    if(PAUSE) {
      let vm = Vm.getInstance();
      vm.run();
      while(vm.isPaused()) vm.resume();
    } else {
      Vm.getInstance().console.input.pushScript(script);
      Vm.getInstance().run();
    }
  } catch(ex) {
    host.output += '\n*** ' + String(ex instanceof Error ? ex.stack : ex);
  } finally {
    process.chdir(cwd);
    (Vm as any).instance = null;
  }
  let secs = ((Date.now() - start) / 1000).toFixed(1) + 's';
  if(RECORD) {
    fs.writeFileSync(path.join(dir, 'game.out'), host.output);
    console.log('recorded with our VM ' + secs);
    continue;
  }
  let expected = fs.readFileSync(path.join(dir, 'game.out'), 'utf8').replace(/\r\n/g, '\n');
  let ignoreSpacing = options.includes('ignore-spacing');
  let same = ignoreSpacing ? host.output.replace(/\s+/g, '') == expected.replace(/\s+/g, '') : host.output == expected;
  if(same) {
    console.log(colors.bold.green('OK') + ' ' + secs);
    passed++;
  } else {
    fs.writeFileSync(path.join(dir, 'actual.out'), host.output);
    console.log(colors.red('different transcript') + ` (see ${path.join(dir, 'actual.out')})`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
