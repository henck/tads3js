import { VmData } from "./VmData";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

interface IBifPtr {
  set: number;
  index: number;
}

export class VmBifPtr extends VmData {
  constructor(set: number, index: number) {
    let ptr: IBifPtr = { set: set, index: index };
    super(ptr);
  }

  getName() {
    return 'bifptr';
  }

  getType() {
    return VmType.BIFPTR;
  }  

  isFalsy(): boolean {
    return true;
  }    

  getSetIndex() {
    return this.value.set;
  }

  getFunctionIndex() {
    return this.value.index;
  }

  // Operators

  not() {
    return new VmNil();
  }  

  eq(data: VmData, depth?: number): boolean {
    if(!(data instanceof VmBifPtr)) return false;
    if ((this.value as IBifPtr).set != (data.value as IBifPtr).set) return false;
    if ((this.value as IBifPtr).index != (data.value as IBifPtr).index) return false;
    return true;
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    return `${this.value.set.toString()},${this.value.index.toString()}`;
  }
}
