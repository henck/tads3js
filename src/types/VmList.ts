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
    // If argument is a list-like, get its array of elements. 
    // Otherwise consider argument an array of a single element.
    let arr = data.unpack();
    if(!Array.isArray(arr)) arr = [data];
    
    // If data is a VmList, then add it to 
    return new VmList(this.value.concat(arr));
  }

  sub(data: VmData): VmData {
    console.log("SUB FROM VMLIST");
    console.log(data);

    // If argument is a list-like, get its array of elements. 
    // Otherwise consider argument an array of a single element.
    let arr = data.unpack();
    if(!Array.isArray(arr)) arr = [data];

    // Remove from the "this" list all elements that occur in the subtracted list:
    let lst = this.value.filter((x: VmData) => !arr.find((y: VmData) => x.eq(y)));
    return new VmList(lst);
  }

  not() {
    return new VmNil();
  }

  eq(data: VmData, depth?: number): boolean {
    // Cancel equals check after 256 stack levels. 
    // This happens when list elements point back to the parent list.    
    depth = depth ?? 0;
    if(depth > 256) return false;

    // Check that other object is also a list-like.
    let arr = data.unpack();
    if(!Array.isArray(arr)) return false;

    // Lists must have same length:
    if(this.value.length != arr.length) return false;

    // Compare lists item-by-item:
    for(let i = 0; i < this.value.length; i++) {
      if (!this.value[i].eq(arr[i], depth + 1)) return false;
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
