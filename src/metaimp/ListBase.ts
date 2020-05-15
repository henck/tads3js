import { VmData, VmInt, VmObject, VmNil, VmList } from "../types"
import { Collection } from "./Collection"
import { MetaString } from "./MetaString"
import { Iterator } from "./Iterator";
import { IndexedIterator } from "./IndexedIterator";
import { List } from "./List";

export abstract class ListBase extends Collection {
  protected value: VmData[];

  getValue() {
    return this.value;
  }  

  setValue(value: VmData[]) {
    this.value = value; 
  }

  protected makeUnique(value: VmData[]): VmData[] {
    // Filter the elements:
    value = value.filter((x:VmData, idx: number) => {
      // For each element, compare it to earlier elements in the list.
      // If it is equal to an earlier element, do not include it.
      return !value.slice(0, idx).find((y:VmData) => {
        // VmObjects are compared using their object's equals method
        // (if there is one)
        if(x instanceof VmObject) {
          let obj = x.getInstance();
          if((obj as any).equals) return (obj as any).equals(y);
          return false; 
        }
        // Other VmData is compared using eq:
        else return x.eq(y);
      });
    });

    return value;
  }

  // Helper method
  protected unwrapIndex(vmIndex: VmInt): number {
    let idx = vmIndex.unwrap();
    idx = idx <= 0 ? this.value.length + idx : idx - 1;
    return idx;
  }     

  public makeIterator(live: boolean): Iterator {
    return new IndexedIterator(live ? this.value : this.value.slice());
  }

  /*
   * Virtual methods
   */

  equals(data: VmData): boolean {
    let otherObj = null;
    // If data is a VmObject, get its instance and check
    // that it is a meta list.
    if(data instanceof VmObject) {
      otherObj = data.getInstance();
      if(!(otherObj instanceof ListBase)) return false;
    // If data is a VmList, convert it to a meta list.
    } else if(data instanceof VmList) {
      otherObj = new List((data as VmList).value);
    // Other types are always unequal.
    } else {
      return false;
    }

    // Lists must have same length to be equal.
    if(this.value.length != otherObj.value.length) return false;

    // Check elements of objects for equality
    // by calling "eq" on them.
    for(let i = 0; i < this.value.length; i++) {
      if (!this.value[i].eq(otherObj.value[i])) return false;
    }    
    return true;
  }   

  public getindex(vmIndex: VmData): VmData {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unwrap();
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    return this.value[idx-1];    
  }  

  /*
   * Meta methods - all protected as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected length(): VmData {
    return new VmInt(this.value.length);
  }

  protected countOf(vmVal: VmData): VmInt {
    return new VmInt(this.value.filter((x) => x.eq(vmVal)).length);
  }

  protected countWhich(vmFunc: VmData): VmInt {
    let lst = this.value.filter((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    return new VmInt(lst.length);
  }

  protected indexOf(vmVal: VmData) : VmInt | VmNil {
    let pos = this.value.findIndex((x: VmData) => x.eq(vmVal));
    return pos == -1 ? new VmNil() : new VmInt(pos + 1);
  }

  protected lastIndexOf(vmVal: VmData) : VmInt | VmNil {
    let pos = this.value.slice().reverse().findIndex((x: VmData) => x.eq(vmVal));
    pos = pos >= 0 ? (this.value.length - 1) - pos : pos;
    return pos == -1 ? new VmNil() : new VmInt(pos + 1);
  }  

  protected join(vmSep?: VmData) : VmObject {
    let sep = vmSep ? vmSep.unwrap() : '';
    let str = this.value.map((x) => x.value.toString()).join(sep);
    return new VmObject(new MetaString(str));
  }

  protected indexOfMax(vmFunc?: VmData): VmNil | VmInt {
    if(this.value.length == 0) return new VmNil();
    // Use reduce to determine index of max value. Reduce starts with index=0,
    // then compares each values with the value at the current index, updating
    // the index to reflect the position of the current max value.
    let maxIndex: number = this.value.reduce(function(maxIndex,x:VmData,idx:number,arr:VmData[]) {
      // Call vmFunc on element is a function was given.
      let xVal: VmData = vmFunc ? vmFunc.invoke(x) : x;
      let currentVal: VmData = vmFunc ? vmFunc.invoke(arr[maxIndex]) : arr[maxIndex];
      return xVal.lt(currentVal) ? maxIndex : idx;
    }, 0);
    return new VmInt(maxIndex + 1); // T3 index starts at 1
  }

  protected indexOfMin(vmFunc?: VmData): VmNil | VmInt {
    if(this.value.length == 0) return new VmNil();
    // Use reduce to determine index of min value. Reduce starts with index=0,
    // then compares each values with the value at the current index, updating
    // the index to reflect the position of the current min value.
    let minIndex: number = this.value.reduce(function(minIndex,x:VmData,idx:number,arr:VmData[]) {
      // Call vmFunc on element is a function was given.
      let xVal: VmData = vmFunc ? vmFunc.invoke(x) : x;
      let currentVal: VmData = vmFunc ? vmFunc.invoke(arr[minIndex]) : arr[minIndex];
      return xVal.lt(currentVal) ? idx : minIndex;
    }, 0);
    return new VmInt(minIndex + 1); // T3 index starts at 1
  }
  
  protected indexWhich(vmFunc: VmData): VmInt {
    let idx = this.value.findIndex((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    if(idx == -1) return new VmNil();
    return new VmInt(idx + 1); // T3 index 1-based
  }  

  protected lastIndexWhich(vmFunc: VmData): VmInt {
    let idx = this.value.slice().reverse().findIndex((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    if(idx == -1) return new VmNil();
    return new VmInt(this.value.length - idx); // T3 index 1-based
  }  

  protected valWhich(vmFunc: VmData): VmData {
    let val = this.value.find((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    if(!val) return new VmNil();
    return val;
  }

  protected lastValWhich(vmFunc: VmData): VmData {
    let val = this.value.slice().reverse().find((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    if(!val) return new VmNil();
    return val;
  }

  protected minVal(vmFunc?: VmData): VmData {
    let max: VmData = this.value.reduce(function(a:VmData,b:VmData) {
      let aVal: VmData = vmFunc ? vmFunc.invoke(a) : a;
      let bVal: VmData = vmFunc ? vmFunc.invoke(b) : b;
      return aVal.lt(bVal) ? a : b;
    });
    return max;
  }
  
  protected maxVal(vmFunc?: VmData): VmData {
    let max: VmData = this.value.reduce(function(a:VmData,b:VmData) {
      let aVal: VmData = vmFunc ? vmFunc.invoke(a) : a;
      let bVal: VmData = vmFunc ? vmFunc.invoke(b) : b;
      return aVal.lt(bVal) ? b : a;
    });
    return max;
  }

  protected forEach(vmFunc: VmData): VmObject {
    this.value.forEach((x) => {
      vmFunc.invoke(x);
    });
    return null;
  }

  protected forEachAssoc(vmFunc: VmData): VmObject {
    this.value.forEach((v, i) => {
      vmFunc.invoke(new VmInt(i+1), v);
    });
    return null;
  }  

}
