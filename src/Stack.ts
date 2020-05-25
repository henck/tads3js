const colors = require('colors');
import { VmData } from './types'

class Stack {
  static readonly STACK_SIZE = 1000;
  static readonly DUMP_SIZE = 15;
  public elements: VmData[];
  public sp: number;
  public fp: number;

  public constructor() {
    this.elements = [];
    this.elements.fill(null, 0, Stack.STACK_SIZE);
    this.sp = 0;
    this.fp = 0;
  }

  // Get the value of local variable at index from the method frame.
  getLocal(localNum: number): VmData {
    return this.elements[this.fp + localNum];
  }
  
  // Set the for the local variable at index in the method frame. 
  setLocal(localNum: number, data: VmData): void {
    this.elements[this.fp + localNum] = data;
  }

  getArg(argNum: number): VmData {
    return this.elements[this.fp - 10 - argNum];
  }

  setArg(argNum: number, data: VmData): void {
    this.elements[this.fp - 10 - argNum] = data;
  }

  // Read the first # arguments from the stack.
  getArgs(count: number): VmData[] {
    let args = [];
    for(let i = 0; i < count; i++) args.push(this.getArg(i));
    return args;
  }

  getArgCount(): number {
    return this.elements[this.fp - 2].value;
  }

  // Return target property (if any)
  getTargetProperty(): VmData {
    return this.elements[this.fp - 9];
  }

  // Return target object (if any)
  getTargetObject(): VmData {
    return this.elements[this.fp - 8];
  }

  // Return defining object (if any)
  getDefiningObject(): VmData {
    return this.elements[this.fp - 7];
  }

  // Return self object (if any)
  getSelf(): VmData {
    return this.elements[this.fp - 6];
  }

  // Return invokee
  getInvokee(): VmData {
    return this.elements[this.fp - 5];
  }

  public push(value: VmData): void {
    if(this.sp >= Stack.STACK_SIZE) throw('STACK OVERFLOW');
    this.elements[this.sp++] = value;
  }

  public pop(): VmData {
    return this.elements[--this.sp];
  }

  //
  // Pop several items from the stack and return them
  // as an array.
  // 
  public popMany(count: number): VmData[] {
    let datas = [];
    for(let i = 0; i < count; i++) datas.push(this.pop());
    return datas;
  }

  public peek(offset: number) {
    return this.elements[offset];
  }

  public dump() {
    console.info('STACK:');
    // (SP points to the next free location on the stack, so we start listing
    // from SP-1.)
    for(let i = this.sp - 1; i >= Math.max(0, this.sp - Stack.DUMP_SIZE); i--) {
      let elem = this.elements[i];
      let idx = i.toString();
      let type = (elem != null ? elem.getName() : '');
      let value = elem != null ? (elem.value !== null ? elem.value : ''): '';
      let isFP = this.fp == i;
      console.info("%s %s %s %s", 
        colors.gray(colors.gray(isFP ? '[FP] ' : '     ')),
        colors.gray(idx.padStart(3, '0')), 
        colors.yellow(type.padEnd(10)), 
        value
      );
    }
  }
}

export { Stack }