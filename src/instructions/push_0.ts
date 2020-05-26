import { Instruction } from "../Instruction";
import { VmInt } from "../types";

export class PUSH_0 extends Instruction {
  constructor() {
    super('PUSH_0', 0x01);
  }

  protected exec() {
    this.stack.push(new VmInt(0));
  }
}