import { Instruction } from "../Instruction";
import { VmObject, VmProp } from "../types";
import { Heap } from "../Heap";

export class EXPINHERIT extends Instruction { // 0x74
  private argc: number;
  private propID: number;
  private objID: number;

  constructor() {
    super('EXPINHERIT', 0x74);
  }  

  protected setup() {
    this.argc = this.maybe_varargc(this.getByte());
    this.propID = this.getUint2();
    this.objID = this.getUint4();
  }

  protected debug() {
    this.debugObj({ argc: this.argc, propID: this.propID, objID: this.objID });
  }

  protected exec() {
    this.vm.ip += 7;
    this.vm.callprop(new VmObject(Heap.getObj(this.objID)), new VmProp(this.propID), this.argc, false, this.stack.getSelf() as VmObject); 
  }
}
