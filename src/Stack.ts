const colors = require('colors');
import { VmData, VmProp, VmNil, VmObject } from './types'

class Stack {
  static readonly STACK_SIZE = 1000;
  static readonly DUMP_SIZE = 15;
  private elements: VmData[];
  public sp: number;
  public fp: number;

  public constructor() {
    this.elements = [];
    this.elements.fill(null, 0, Stack.STACK_SIZE);
    this.sp = 0;
    this.fp = 0;
  }

  /**
   * Peek at value on stack, from a relative position from the top of the stack.
   * @param offset Optional offset from top of stack. Assume 0 (top of stack) if not given.
   * @returns Wrapped value
   */
  public peek(offset?: number): VmData {
    offset = offset ?? 0; // Assume 0 if no offset given
    offset = this.sp - 1 - offset; // Calculate stack index
    return this.elements[offset];
  }

  /**
   * Set value on stack at offset, which is a relative position from the top of the stack.
   * @param offset Optional offset from top of stack.
   * @param data Wrapped value
   */
  public poke(offset: number, data: VmData): void {
    offset = offset ?? 0; // Assume 0 if no offset given
    offset = this.sp - 1 - offset; // Calculate stack index
    this.elements[offset] = data;
  }

  /**
   * Peek at value at absolute position on stack.
   * @param offset 
   * @returns Wrapped value
   */
  public peekAbsolute(offset: number): VmData {
    return this.elements[offset];
  }

  /**
   * Push a value onto the stack.
   * @param value Value to push.
   * @throws Stack overflow if stack if full.
   */
  public push(value: VmData): void {
    if(this.sp >= Stack.STACK_SIZE) throw('STACK OVERFLOW');
    this.elements[this.sp++] = value;
  }

  /**
   * Remove a value from the top of the stack.
   * @returns Wrapped value
   * @throws Stack underflow if stack is empty.
   */
  public pop(): VmData {
    if(this.sp <= 0) throw('STACK UNDERFLOW');
    return this.elements[--this.sp];
  }

  /**
   * Pop several items from the stack and return them
   * as an array.
   * @returns Array of wrapped values
   */ 
  public popMany(count: number): VmData[] {
    let datas = [];
    for(let i = 0; i < count; i++) datas.push(this.pop());
    return datas;
  }

  /**
   * Get the value of local variable at index from the current
   * function frame.
   * @param localNum Index of local variable (0-based)
   * @returns Wrapped value
   */
  getLocal(localNum: number): VmData {
    return this.elements[this.fp + localNum];
  }
  
  /** 
   * Set the value for the local variable at index in the current
   * function frame. 
   * @param localNum Index of local variable (0-based)
   * @param data Wrapped value for local variable
   */
  setLocal(localNum: number, data: VmData): void {
    this.elements[this.fp + localNum] = data;
  }

  /**
   * Read argument value for current function from the current
   * function frame.
   * @param argNum Argument index (0-based)
   * @returns Wrapped argument value
   */
  getArg(argNum: number): VmData {
    return this.elements[this.fp - 10 - argNum];
  }

  /**
   * Overwrite argument value for current function from the
   * current function frame.
   * @param argNum Argument index (0-based)
   * @param data Wrapped argument value
   */
  setArg(argNum: number, data: VmData): void {
    this.elements[this.fp - 10 - argNum] = data;
  }

  /**
   * Reads a number of arguments for the current function from 
   * the current function frame. Starts at the first argument.
   * @param count Number of arguments to read.
   * @returns Array of wrapped values.
   */
  getArgs(count: number): VmData[] {
    let args = [];
    for(let i = 0; i < count; i++) args.push(this.getArg(i));
    return args;
  }

  /**
   * Read argument count of current function from the current function frame.
   * @returns Number of arguments
   */
  getArgCount(): number {
    return this.elements[this.fp - 2].value;
  }

  /**
   * Read target property of current function from the current function frame.
   * @returns Target property or VmNil
   */
  getTargetProperty(): VmProp | VmNil {
    return this.elements[this.fp - 9];
  }

  /**
   * Write target property of current function in the current function frame.
   * @param vmVal Target property or VmNil
   */
  setTargetProperty(vmVal: VmProp | VmNil) {
    this.elements[this.fp - 9] = vmVal;
  }

  /**
   * Read target object of current function from the current function frame.
   * @returns Target object or VmNil
   */
  getTargetObject(): VmObject | VmNil {
    return this.elements[this.fp - 8];
  }

  /**
   * Write target object of current function in the current function frame.
   * @param vmVal Target object or VmNil
   */
  setTargetObject(vmVal: VmObject | VmNil) {
    this.elements[this.fp - 8] = vmVal;
  }

  /**
   * Read defining object of current function from the current function frame.
   * @returns Defining object or VmNil
   */
  getDefiningObject(): VmObject | VmNil {
    return this.elements[this.fp - 7];
  }

  /**
   * Write defining object of current function in the current function frame.
   * @param vmVal Defining object or VmNil
   */
  setDefiningObject(vmVal: VmObject | VmNil) {
    this.elements[this.fp - 7] = vmVal;
  }

  /**
   * Read self object of current function from the current function frame.
   * @returns Self object or VmNil
   */
  getSelf(): VmObject | VmNil {
    return this.elements[this.fp - 6];
  }

  /**
   * Write self object of current function in the current function frame.
   * @param vmVal Self object or VmNil
   */
  setSelf(vmVal: VmObject | VmNil) {
    this.elements[this.fp - 6] = vmVal;
  }

  // Return invokee
  getInvokee(): VmData {
    return this.elements[this.fp - 5];
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