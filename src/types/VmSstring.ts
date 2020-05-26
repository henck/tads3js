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
  
  add(data: VmData): VmObject {
    let str = this.value;
    // Is data a MetaString?
    if(data instanceof VmObject && data.getInstance() instanceof MetaString) {
      str += data.getInstance().getValue();
    } 
    // Not a MetaString, so another object or a simple type.
    else {
      str += data.value.toString();
    }
    return new VmObject(new MetaString(str));
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
