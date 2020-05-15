import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmObject, VmList } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { ListBase } from "./ListBase";

export class List extends ListBase {
  
  //
  // A List can be constructed by either passing in an array of items,
  // or each item as an argument.
  //
  constructor(...args: any[]) {
    super();
    if(args.length == 1 && Array.isArray(args[0])) {
      this.value = args[0];
    } else {
      this.value = [...args];
    }
  }

  getMethodByIndex(idx: number): TPropFunc {
    // Interestingly, applyAll does compile, but yields a propID that
    // the List metaclass does not recognize, although it should map
    // the same as 'mapAll'.
    switch(idx) {
      case 0: return this.subset;
      case 1: return this.mapAll;
      case 2: return this.length;
      case 3: return this.sublist;
      case 4: return this.intersect;
      case 5: return this.indexOf;
      case 6: return this.car;
      case 7: return this.cdr;      
      case 8: return this.indexWhich;
      case 9: return this.forEach;
      case 10: return this.valWhich;
      case 11: return this.lastIndexOf;
      case 12: return this.lastIndexWhich;
      case 13: return this.lastValWhich;
      case 14: return this.countOf;
      case 15: return this.countWhich;
      case 16: return this.getUnique;
      case 17: return this.appendUnique;
      case 18: return this.append;
      case 19: return this.sort;
      case 20: return this.prepend;
      case 21: return this.insertAt;
      case 22: return this.removeElementAt;
      case 23: return this.removeRange;
      case 24: return this.forEachAssoc;
      case 25: return this.generate;
      case 26: return this.splice;
      case 27: return this.join;
      case 28: return this.indexOfMin;
      case 29: return this.minVal;
      case 30: return this.indexOfMax;
      case 31: return this.maxVal;
    }
    return null;
  }  

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('List: Cannot load from image');
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private append(data: VmData): VmObject {
    let lst = new List([...this.value, data]);
    return new VmObject(lst);
  }

  private appendUnique(vmList: VmData): VmObject {
    let lst = vmList.unwrap();
    let values = (lst instanceof List) ? lst.getValue() : lst; 
    let newLst = this.makeUnique([...this.value, ...values]);
    return new VmObject(new List(newLst));    
  }

  private prepend(data: VmData): VmObject {
    let lst = new List([data, ...this.value]);
    return new VmObject(lst);
  }

  private getUnique(): VmObject {
    let value = this.makeUnique(this.value);
    return new VmObject(new List(value));    
  }

  private car(): VmData {
    if(this.value.length == 0) return new VmNil();
    return this.value[0];
  }

  private cdr(): VmData {
    if(this.value.length == 0) return new VmNil();
    return this.value[this.value.length-1];
  }

  private splice(vmStartIndex: VmInt, vmDeleteCount: VmInt, ...args: VmData[]): VmObject {
    let idx = this.unwrapIndex(vmStartIndex);
    let deleteCount = vmDeleteCount.unwrap();
    let values = this.value.concat([]);
    values.splice(idx, deleteCount, ...args);
    return new VmObject(new List(values));
  }

  private sublist(vmStartIndex: VmInt, vmLength?: VmInt) : VmObject {
    let start = vmStartIndex.unwrap() - 1;
    let length = vmLength ? vmLength.unwrap() : null;

    let out;
    // Negative start means an offset from the end of the list.
    // A start of -1 means the last item.
    if(start < 0) {
      start = this.value.length + start + 1;
    }
    // No length
    if(!length) {
      out = this.value.slice(start);
    }
    // A positive length means number of characters to keep
    // from start;
    else if(length >= 0) {
      out = this.value.slice(start, start+length);
    } 
    // A negative length means number of items to discard
    // from end of list.
    else {
      out = this.value.slice(start, this.value.length + length);
    }

    return new VmObject(new List(out));
  }

  private removeElementAt(vmIdx: VmInt): VmObject {
    let idx = this.unwrapIndex(vmIdx);
    if(idx < 0 || idx > this.value.length-1) throw('index out of range');
    let newValue = this.value.slice();
    newValue.splice(idx, 1);
    return new VmObject(new List(newValue));
  }

  private removeRange(vmStartIndex: VmInt, vmEndIndex: VmInt): VmObject {
    let startIdx = this.unwrapIndex(vmStartIndex);
    let endIdx = this.unwrapIndex(vmEndIndex);
    if(startIdx < 0 || startIdx > this.value.length-1) throw('index out of range');
    if(endIdx < 0 || endIdx > this.value.length-1) throw('index out of range');
    if(endIdx < startIdx) throw('End index must be greater than or equal to start index');
    let count = endIdx - startIdx + 1;
    let newValue = this.value.slice();
    newValue.splice(startIdx, count);
    return new VmObject(new List(newValue));
  }

  private insertAt(vmIndex: VmInt, ...args: VmData[]) : VmObject {
    let idx = this.unwrapIndex(vmIndex);
    let newValue = this.value.slice(0);
    newValue.splice(idx, 0, ...args);
    return new VmObject(new List(newValue));
  }

  private subset(vmFunc: VmData): VmObject {
    let lst: VmData[] = [];
    lst = this.value.filter((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    return new VmObject(new List(lst));
  }

  private mapAll(vmFunc: VmData): VmObject {
    let lst = this.value.map((x) => {
      return vmFunc.invoke(x);
    });
    return new VmObject(new List(lst));
  }

  private sort(vmDescending?: VmData, vmFunc?: VmData): VmObject {
    // Descending is false if unspecified, or VmNil, or VmInt=0
    let descending = (!vmDescending || vmDescending.isFalsy()) ? false : true;

    // Make a copy, because sort happens in place.
    let lst = this.value.slice();

    // Sort in place, either by comparing elements or by calling 
    // a callback with two arguments.
    lst.sort((a: VmData, b: VmData) => {
      if(vmFunc) {
        return vmFunc.invoke(a,b).value;;
      } else {
        return a.lt(b) ? -1 : 1;
      }
    });

    // If descending, reverse result in place.
    if(descending) lst.reverse();

    // Return result as new Metalist:
    return new VmObject(new List(lst));
  }

  private generate(vmFunc: VmData, vmN: VmData) {
    let n = vmN.unwrap();
    if(n <= 0) n = 0;

    let lst = [];
    for(let i = 1; i <= n; i++) {
      lst.push(vmFunc.invoke(new VmInt(i)).value);
    }

    return new VmObject(new List(lst));
  }

  /**
   * Returns a new list consisting of the intersection of this list and lst2; 
   * that is, a list consisting of the elements common to both this list and lst2. 
   *  
   * If the two lists have no elements in common, the result is an empty list. 
   * 
   * If an element of the shorter list (or, if the lists are of equal length, this list)
   * appears more than once in the shorter list, and that element value also appears in 
   * the longer list, then the element will be in the result list the same number of times 
   * that it is in the shorter list. 
   *  
   * An element repeated in the longer list will not be repeated in the result list.     
   */
  private intersect(vmLst: VmObject) {
    // Convert argument to simple array:
    let arg = vmLst.unwrap();
    let lst2: VmData[] = ((arg instanceof List) ? arg.getValue() : arg); 

    // Determine which is the shorter list:
    let short = this.value;
    let long = lst2;
    if(this.value.length > lst2.length) {
      long = this.value;
      short = lst2;
    }

    let result: VmData[];
    result = short.filter((x) => {
      return long.find((y) => x.eq(y));
    });

    return new VmObject(new List(result));
  }

  getValue() {
    return this.value;
  }  

}

MetaclassRegistry.register('list/030008', List);