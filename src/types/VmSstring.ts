import { VmData } from "./VmData"
import { VmNil } from "./VmNil"
import { VmObject } from "./VmObject"
import { MetaString } from "../metaimp"
import { VmType } from "./VmType";

export class VmSstring extends VmData {
  constructor(value: string) {
    super(value);
  }

  getName() {
    return 'sstring';
  }

  getType() {
    return VmType.SSTRING;
  }  

  // Operators
  
  add(data: VmData): VmData {
    // Adding nil adds nothing; anything else is converted to a string
    // (e.g. lists and vectors become comma-separated elements).
    let str = this.value + (data instanceof VmNil ? '' : data.toStr());
    return new VmSstring(str);
  }

  not() {
    return new VmNil();
  }

  eq(data: VmData, depth?: number): boolean {
    let str = data.unpack();
    if(typeof(str) !== 'string') return false;
    return this.value == str;
  }

  lt(data: VmData): boolean {
    let str = data.unpack();
    if(typeof(str) !== 'string') throw('INVALID_COMPARISON');
    return this.value < str;
  }    

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value;
  }
}
