import * as fs from 'fs';
import { Vm } from './Vm';
import { Debug } from './Debug';
import { ConsoleHost } from './io/ConsoleHost';

/*
 * Command-line interpreter: node build/Interpreter.js [options] game.t3
 *
 *   -i file   read commands from a script file first (lines starting with
 *             '>' are commands, or an <eventscript>), then from the keyboard
 *   -norand   don't seed the random number generator (so a game behaves
 *             the same each time, like t3run -norand)
 *   -debug    show debugging output
 *   -fixedclock  a make-believe clock (for reproducible runs of games that use the time)
 *   -html     act like an HTML TADS interpreter (images, banner windows...)
 *   -banners  (with -html) show the markup of banner windows when they change
 */
const USAGE = 'usage: node build/Interpreter.js [-i script] [-norand] [-fixedclock] [-debug] [-html [-banners]] game.t3';

let args = process.argv.slice(2);
let script: string = null;
let randomSeed = true;
let image: string = null;
let html = false, banners = false;
let vm = Vm.getInstance();
Debug.SHOW = false;
for(let i = 0; i < args.length; i++) {
  if(args[i] == '-i') script = args[++i];
  else if(args[i] == '-debug') Debug.SHOW = true;
  else if(args[i] == '-norand') randomSeed = false;
  else if(args[i] == '-html') html = true;
  else if(args[i] == '-fixedclock') vm.fixedClock = true;
  else if(args[i] == '-banners') banners = true;
  else if(image === null) image = args[i];
  else { console.error(USAGE); process.exit(2); }
}
if(image === null) {
  console.error(USAGE);
  process.exit(2);
}

let host = new ConsoleHost();
host.html = html;
if(banners) host.banner = (e) => {
  if(e.op == 'update') host.write(`[banner ${e.handle}]\n${e.html.replace(/\n*$/, '')}\n[/banner]\n`);
};
vm.host = host;
vm.randomSeed = randomSeed;
try {
  vm.load(image);
  if(script !== null) vm.console.input.pushScript(fs.readFileSync(script, 'utf8'));
  vm.run();
} catch(ex) {
  console.error('\n*** ' + (ex instanceof Error ? ex.stack : String(ex)));
  process.exitCode = 1;
}
