import { Vm } from "./Vm";

const colors = require('colors');

export class Debug {
  static SHOW: boolean = true;
  static opname: string;
  static ip: number;
  static opcode: number;

  static info(...args: any[]) {
    if(!Debug.SHOW) return;
    let str = "";
    for(let i = 0; i < args.length; i++) str = str + '%s ';
    console.info(str, ...args);
  }

  static instruction(args?: {}) {
    if(!Debug.SHOW) return;
    let ipstr = colors.gray(Debug.ip.toString().padStart(6, '0'));
    let opcodestr = colors.blue.bold('0x' + Debug.opcode.toString(16).padStart(2, '0'));
    let opname = colors.magenta.bold(Debug.opname.padEnd(12));
    let final = [];
    if(!!args) {
      for(let [key, value] of Object.entries(args)) {
        final.push(key+'='+JSON.stringify(value));
      }
    }
    console.log(ipstr, opcodestr, opname, ...final);
  }
}