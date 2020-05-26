import { VmData } from "./VmData";
import { VmNil } from "./VmNil";
import { VmInt } from "./VmInt";
import { VmObject } from "./VmObject";
import { List } from "../metaimp";
import { VmType } from "./VmType";

export class VmList extends VmData {
  constructor(value: any[]) {
    super(value);
  }

  getName() {
    return 'list';
  }

  getType() {
    return VmType.LIST;
  }  

  // Operators

  add(data: VmData): VmData {
    if(data instanceof VmList) {
      return new VmObject(new List(this.value.concat(data.value)));
    } else {
      return new VmObject(new List(this.value.concat([data])));
    }
  }

  sub(data: VmData): VmData {
    let res;
    if(data instanceof VmList) {  // [x,y,z] - [a,b,c]
      res = this.value.filter((x: VmData) => !data.value.find((y: VmData) => y.constructor == x.constructor && y.value == x.value));
    } else { // [x,y,z] - 3
      res = this.value.filter((x: VmData) => !(x.constructor == data.constructor && x.value == data.value));
    }
    return res;
  }

  not() {
    return new VmNil();
  }

  eq(data: VmData): boolean {
    if(!(data instanceof VmList)) return false;
    if(this.value.length != data.value.length) return false;
    for(let i = 0; i < this.value.length; i++) {
      if (!this.value[i].eq(data.value[i])) return false;
    }    
    return true;
  }

  getind(vmIndex: VmData): VmData {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unpack();
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    return this.value[idx-1];
  }

  setind(vmIndex: VmData, data: VmData): VmObject {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.value;
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    let newvalues = this.value.concat([]); // clone list
    newvalues[idx-1] = data;
    return new VmObject(new List(newvalues));
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value.map((x: VmData) => x.toStr(radix, isSigned)).join(',');
  }   
}
