import { Instruction } from "../Instruction";
import { VmObject } from "../types";

export class PUSHOBJ extends Instruction {
  private ref: number;

  constructor() {
    super('PUSHOBJ', 0x07);
  }

  protected setup() {
    this.ref = this.getUint4();
  }

  protected debug() {
    this.debugObj({ value: this.ref });
  }

  protected exec() {
    this.stack.push(new VmObject(this.ref));
    this.vm.ip += 4;
  }
}