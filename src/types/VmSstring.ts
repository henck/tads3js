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

  eq(data: VmData): boolean {
    // Compare to sstring:
    if(data instanceof VmSstring) return this.value == data.value;
    // Compare to MetaString:
    if(data instanceof VmObject && data.getInstance() instanceof MetaString) return this.value == data.getInstance().getValue();
    // Anything else:
    return false;
  }

  lt(data: VmData): boolean {
    // Compare to sstring:
    if(data instanceof VmSstring) return this.value < data.value;
    // Compare to MetaString:
    if(data instanceof VmObject && data.getInstance() instanceof MetaString) return this.value < data.getInstance().getValue();
    // Anything else:
    throw('INVALID_COMPARISON');
  }    

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value;
  }
}
