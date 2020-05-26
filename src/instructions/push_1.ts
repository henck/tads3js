import { Instruction } from "../Instruction";
import { VmInt } from "../types";

export class PUSH_1 extends Instruction {
  constructor() {
    super('PUSH_1', 0x02);
  }

  protected exec() {
    this.stack.push(new VmInt(1));
  }
}