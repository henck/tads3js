const colors = require('colors');
const execSync = require('child_process').execSync; 
const fs = require('fs');

import { Vm } from './Vm';
import { Debug } from './Debug';
import { VmTrue } from './types';
import { Dirent } from 'fs';

Debug.SHOW = false;

//
// Compile source .t file into .t3
//
function compile(path: string) {
  let cmd = `d:\\apps\\tads3\\t3make.exe -a -al -o test.t3 -Fy obj -Fo obj ${path} -lib "system.tl" -x "_main" -x "file" -x "tok" -x "gramprod" -x "multmeth"`;
  execSync(cmd);
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

// 
// Test a script by running test.3 and checking whether
// the result in R0 register is True.
// 
function test(script: string) {
  process.stdout.write(script.padEnd(40));

  Vm.getInstance().load('test.t3');
  let r0 = Vm.getInstance().run();

  // See if R0 contains True value.
  console.log("%s", 
    r0 instanceof VmTrue ? colors.bold.green('OK') : colors.red('fail'));
}

//
// Compile and test all .t files in /test directory
// 
getScripts("test").forEach((script: string) => {
  //if(script == 'test\\list\\countOf.t') {
    compile(script);
    test(script);
  //}
  //throw('halt');
});


