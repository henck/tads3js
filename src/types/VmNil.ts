import { VmData } from "./VmData";
import { VmTrue } from "./VmTrue";
import { VmType } from "./VmType";

export class VmNil extends VmData {
  constructor() {
    super(null);
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
