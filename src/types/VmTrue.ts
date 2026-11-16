import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { VmType } from "./VmType";

export class VmTrue extends VmData {
  // nil and true have no state, so there's one shared instance of each
  // (new VmTrue() returns it, avoiding an allocation).
  private static shared: VmTrue = null;

  constructor() {
    super(null);
    if(VmTrue.shared) return VmTrue.shared;
    VmTrue.shared = this;
  }

  getName() {
    return 'true';
  }

  getType() {
    return VmType.TRUE;
  }  

  // Operators
  
  not() {
    return new VmNil();
  }

  boolize() {
    return new VmTrue();
  }

  eq(data: VmData, depth?: number): boolean {
    return (data instanceof VmTrue);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return 'true';
  } 
}
