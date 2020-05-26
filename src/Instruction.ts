const colors = require('colors');

import { Vm } from "./Vm";
import { Stack } from "./Stack";
import { Debug } from "./Debug";

export abstract class Instruction {
  private opname: string;
  private opcode: number;

  protected vm: Vm;
  protected stack: Stack;
  protected ip: number;

  constructor(opname: string, opcode: number) {
    this.opname = opname;
    this.opcode = opcode;
  }

  protected maybe_varargc(argc: number) {
    if(this.vm.varargc != undefined) {
      argc = this.vm.varargc;
      this.vm.varargc = undefined;
    }
    return argc;
  }

  protected getByte(): number {
    let val = this.vm.codePool.getByte(this.ip);
    this.ip += 1;
    return val;
  }

  protected getUint2(): number {
    let val = this.vm.codePool.getUint2(this.ip);
    this.ip += 2;
    return val;
  }
  
  protected getUint4(): number {
    let val = this.vm.codePool.getUint4(this.ip);
    this.ip += 4;
    return val;
  }

  public execute(vm: Vm, stack: Stack) {
    this.vm = vm;
    this.stack = stack;
    this.ip = vm.ip;
    this.setup();
    this.debug();
    this.exec();
  }

  protected debugObj(args?: {}) {
    if(!Debug.SHOW) return;
    let ipstr = colors.gray(this.ip.toString().padStart(4, '0'));
    let opcodestr = colors.blue.bold('0x' + this.opcode.toString(16).padStart(2, '0'));
    let opname = colors.magenta.bold(this.opname.padEnd(12));
    let final = [];
    if(!!args) {
      for(let [key, value] of Object.entries(args)) {
        final.push(key+'='+JSON.stringify(value));
      }
    }
    console.log(ipstr, opcodestr, opname, ...final);
  }

  protected debug() {
    this.debugObj();
  }

  protected setup() { } 

  protected abstract exec(): void;
}
