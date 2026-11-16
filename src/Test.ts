const colors = require('colors');
const execSync = require('child_process').execSync;
const fs = require('fs');

import { Vm } from './Vm';
import { Debug } from './Debug';
import { VmTrue } from './types';
import { BufferHost } from './io/Host';
import { Dirent } from 'fs';

Debug.SHOW = false;

// Path to the TADS 3 compiler. Override with the T3MAKE environment variable.
const T3MAKE = process.env.T3MAKE ?? 'C:\\Program Files (x86)\\TADS 3\\t3make.exe';

// Reference TADS 3 VM, used by --oracle. Override with T3RUN.
const T3RUN = process.env.T3RUN ?? T3MAKE.replace(/t3make\.exe$/i, 't3run.exe');

// Command line: [--oracle] [--record] [filter]
//   filter    only run tests whose path contains this string,
//             e.g. `npm test -- vector` or `npm test -- vector\\sort.t`.
//   --oracle  run the tests on the reference TADS VM (t3run) instead of
//             ours, to check that the tests themselves are correct.
//   --record  with --oracle: save each passing test's output on the
//             reference VM as its expected output (name.out).
//
// A test passes if its _main returns true and, if there is a name.out file
// next to it, its output matches that file. A name.in file next to it is a
// command script for input (lines starting with '>' are input lines).
const ARGS = process.argv.slice(2);
const ORACLE = ARGS.includes('--oracle');
const RECORD = ARGS.includes('--record');
const FILTER = ARGS.filter((a) => !a.startsWith('--'))[0];

const LIBS = '-lib "system.tl" -x "_main" -x "file" -x "tok" -x "gramprod" -x "multmeth"';

/**
 * Multimedia resources for a test: the files in a directory next to it
 * named like the test with ".res" (e.g. test/file/resource.res/ for
 * resource.t), embedded under their own names.
 */
function resources(path: string): string {
  let dir = path.replace(/\.t$/, '.res');
  if(!fs.existsSync(dir)) return '';
  return ' -res ' + fs.readdirSync(dir).map((f: string) => `"${dir}\\${f}=${f}"`).join(' ');
}

//
// Compile source .t file into .t3
//
function compile(path: string) {
  // Compiler output directory (gitignored, so absent in a fresh clone).
  fs.mkdirSync('obj', { recursive: true });
  let cmd = `"${T3MAKE}" -a -al -o test.t3 -Fy obj -Fo obj ${path} ${LIBS}${resources(path)}`;
  execSync(cmd, { stdio: 'pipe' });
}

//
// Compile a test together with tools/oracle.t and run it on the reference
// VM. Returns true if the test's _main returned true.
//
function runOracle(path: string): boolean {
  let dir = 'obj\\oracle';
  fs.mkdirSync(dir, { recursive: true });
  let cmd = `"${T3MAKE}" -a -o ${dir}\\test.t3 -Fy ${dir} -Fo ${dir} -D _main=_testMain ${path} tools\\oracle.t ${LIBS}${resources(path)}`;
  execSync(cmd, { stdio: 'pipe' });
  // t3run's output is lost when stdout is a pipe, so redirect to a file.
  // Run in plain mode with a command script, which also turns off [More].
  fs.rmSync(`${dir}\\out.txt`, { force: true });
  let input = path.replace(/\.t$/, '.in'), expected = path.replace(/\.t$/, '.out');
  let script = input;
  if(!fs.existsSync(input)) {
    script = `${dir}\\empty.in`;
    fs.writeFileSync(script, '');
  }
  execSync(`"${T3RUN}" -plain -cs utf-8 -I ${script} ${dir}\\test.t3 > ${dir}\\out.txt`, { stdio: 'pipe', timeout: 60000 });
  let out = fs.readFileSync(`${dir}\\out.txt`, 'utf8').replace(/\r\n/g, '\n');
  let pass = out.includes('ORACLE:PASS');
  let output = out.substr(0, out.lastIndexOf('ORACLE:'));
  if(RECORD && pass) fs.writeFileSync(expected, output);
  else if(fs.existsSync(expected) && output != readExpected(expected)) return false;
  return pass;
}

/** A test's expected output. */
function readExpected(path: string): string {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

//
// Get a list of all test scripts (*.t) in path (recursively).
// Returns a list of paths relative to code directory.
//
function getScripts(dir: string): string[] {
  let results: string[] = [];
  let entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((ent: Dirent) => {
    if(ent.isFile() && ent.name.endsWith('.t')) results.push(dir + '\\' + ent.name);
    if(ent.isDirectory()) results = results.concat(getScripts(dir + '\\' + ent.name));
  });
  return results;
};

let passed = 0;
let failed: string[] = [];

//
// Test a script by running test.t3 and checking whether
// the result in R0 register is True.
//
function test(script: string) {
  process.stdout.write(script.padEnd(40));

  if(ORACLE) {
    let ok = false;
    try {
      ok = runOracle(script);
    } catch(ex) {
      console.log(colors.yellow('oracle error'));
      console.log(String(ex.stdout ?? ex).trim().split('\n').map((l: string) => '    ' + l).join('\n'));
      failed.push(script);
      return;
    }
    console.log(ok ? colors.bold.green('OK (reference VM)') : colors.red('fail (reference VM)'));
    if(ok) passed++; else failed.push(script);
    return;
  }

  try {
    compile(script);
  } catch(ex) {
    console.log(colors.yellow('compile error'));
    console.log(String(ex.stdout ?? ex).trim().split('\n').map((l: string) => '    ' + l).join('\n'));
    failed.push(script);
    return;
  }

  try {
    let input = script.replace(/\.t$/, '.in'), expected = script.replace(/\.t$/, '.out');
    let host = new BufferHost();
    Vm.getInstance().host = host;
    Vm.getInstance().load('test.t3');
    if(fs.existsSync(input)) Vm.getInstance().console.input.pushScript(fs.readFileSync(input, 'utf8'));
    // Guard against tests that loop forever because of a VM bug.
    Vm.getInstance().instructionLimit = 10000000;
    let r0 = Vm.getInstance().run();
    if(fs.existsSync(expected) && host.output != readExpected(expected)) {
      console.log(colors.red('wrong output (see obj\\actual.out)'));
      fs.writeFileSync('obj\\actual.out', host.output);
      failed.push(script);
    } else if(r0 instanceof VmTrue) {
      console.log(colors.bold.green('OK'));
      passed++;
    } else {
      console.log(colors.red('fail'));
      failed.push(script);
    }
  } catch(ex) {
    console.log(colors.red('error: ') + String(ex instanceof Error ? ex.message : ex));
    failed.push(script);
    // Reset the VM so a crashed test doesn't affect the next one.
    (Vm as any).instance = null;
  }
}

//
// Compile and test all .t files in /test directory
//
getScripts("test")
  .filter((script: string) => !FILTER || script.includes(FILTER))
  .forEach(test);

console.log();
console.log(`${passed} passed, ${failed.length} failed`);
process.exitCode = failed.length > 0 ? 1 : 0;
