import { VmData } from "./VmData";
import { VmTrue } from "./VmTrue";
import { VmType } from "./VmType";

export class VmNil extends VmData {
  // nil and true have no state, so there's one shared instance of each
  // (new VmNil() returns it, avoiding an allocation).
  private static shared: VmNil = null;

  constructor() {
    super(null);
    if(VmNil.shared) return VmNil.shared;
    VmNil.shared = this;
  }

  getName() {
    return 'nil';
  }

  getType() {
    return VmType.NIL;
  }  

  isFalsy(): boolean {
    return true;
  }    

  // Operators

  not(): VmData {
    return new VmTrue();
  }

  boolize() {
    return new VmNil();
  }

  eq(data: VmData, depth?: number): boolean {
    return data instanceof VmNil;
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return 'nil';
  }
}
