import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmObject, VmList, VmNativeCode } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { ListBase } from "./ListBase";
import { VmType } from '../types/VmType';

class List extends ListBase {
  
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

  getType() {
    return VmType.LIST;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    // Interestingly, applyAll does compile, but yields a propID that
    // the List metaclass does not recognize, although it should map
    // the same as 'mapAll'.
    switch(idx) {
      case 0: return new VmNativeCode(this.subset);
      case 1: return new VmNativeCode(this.mapAll);
      case 2: return new VmNativeCode(this.length);
      case 3: return new VmNativeCode(this.sublist);
      case 4: return new VmNativeCode(this.intersect);
      case 5: return new VmNativeCode(this.indexOf);
      case 6: return new VmNativeCode(this.car);
      case 7: return new VmNativeCode(this.cdr);
      case 8: return new VmNativeCode(this.indexWhich);
      case 9: return new VmNativeCode(this.forEach);
      case 10: return new VmNativeCode(this.valWhich);
      case 11: return new VmNativeCode(this.lastIndexOf);
      case 12: return new VmNativeCode(this.lastIndexWhich);
      case 13: return new VmNativeCode(this.lastValWhich);
      case 14: return new VmNativeCode(this.countOf);
      case 15: return new VmNativeCode(this.countWhich);
      case 16: return new VmNativeCode(this.getUnique);
      case 17: return new VmNativeCode(this.appendUnique);
      case 18: return new VmNativeCode(this.append);
      case 19: return new VmNativeCode(this.sort);
      case 20: return new VmNativeCode(this.prepend);
      case 21: return new VmNativeCode(this.insertAt);
      case 22: return new VmNativeCode(this.removeElementAt);
      case 23: return new VmNativeCode(this.removeRange);
      case 24: return new VmNativeCode(this.forEachAssoc);
      case 25: return new VmNativeCode(this.generate);
      case 26: return new VmNativeCode(this.splice);
      case 27: return new VmNativeCode(this.join);
      case 28: return new VmNativeCode(this.indexOfMin);
      case 29: return new VmNativeCode(this.minVal);
      case 30: return new VmNativeCode(this.indexOfMax);
      case 31: return new VmNativeCode(this.maxVal);
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

  /**
   * Appends the value to this list, returning the resulting list.
   * @param data Value to append
   * @returns New list
   */
  private append(data: VmData): VmObject {
    let lst = new List([...this.value, data]);
    return new VmObject(lst);
  }

  /**
   * Appends the elements of the list to this list, returning a new list 
   * consisting only of the unique elements of the combination.
   * @param vmList List to append
   * @returns New list
   */
  private appendUnique(vmList: VmData): VmObject {
    let lst = vmList.unpack();
    let values = (lst instanceof List) ? lst.getValue() : lst; 
    let newLst = this.makeUnique([...this.value, ...values]);
    return new VmObject(new List(newLst));    
  }

  /**
   * Returns the first element of the list.
   * @returns Element, or nil for empty list.
   */
  private car(): VmData {
    if(this.value.length == 0) return new VmNil();
    return this.value[0];
  }

  /**
   * Returns the "tail" of the list; that is, the rest of the list after removing the first element.
   * @returns Tail of list, or nil for empty list.
   */
  private cdr(): VmData {
    if(this.value.length == 0) return new VmNil();
    return new VmObject(new List(this.value.slice(1)));
  }

  /**
   * Creates a new list containing n elements by invoking the callback function once for 
   * each element, and using the return value as the element value.
   * @param vmFunc Callback function
   * @param vmN Number of elements to generate
   */
  private generate(vmFunc: VmData, vmN: VmData) {
    let n = vmN.unpack();
    if(n <= 0) n = 0;

    let lst = [];
    for(let i = 1; i <= n; i++) {
      let numParams = vmFunc.funcinfo().params;
      let args = [];
      if(numParams > 0) args.push(new VmInt(i));
      lst.push(vmFunc.invoke(...args));
    }

    return new VmObject(new List(lst));
  }

  /**
   * Returns a new list consisting of the unique elements of the original list. 
   * @returns new List
   */
  private getUnique(): VmObject {
    let value = this.makeUnique(this.value);
    return new VmObject(new List(value));    
  }

  /**
   * Returns a new list which results from inserting the given values (val1, val2, and so on) 
   * into the existing list before the element at the position given by index.
   * @param vmIndex Index to insert at
   * @param args Values
   */
  private insertAt(vmIndex: VmInt, ...args: VmData[]) : VmObject {
    let idx = this.unpackIndex(vmIndex);
    let newValue = this.value.slice(0);
    newValue.splice(idx, 0, ...args);
    return new VmObject(new List(newValue));
  }

  /**
   * Returns a new list consisting of the intersection of this list and another list.
   * @param vmList List to intersect with
   * @returns new List
   */
  private intersect(vmLst: VmObject) {
    // Convert argument to simple array:
    let arg = vmLst.unpack();
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

  /**
   * For each element of the list, this method invokes the callback function, 
   * passing the current element as the single argument, then adds the callback's 
   * return value to a new list.
   * @param vmFunc Callback function
   * @returns new List
   */
  private mapAll(vmFunc: VmData): VmObject {
    let lst = this.value.map((x) => vmFunc.invoke(x));
    return new VmObject(new List(lst));
  }

  /**
   * Returns a new list which results from inserting the value before 
   * the first element of the existing list. 
   * @param val Value to prepend
   * @returns New List
   */
  private prepend(val: VmData): VmObject {
    let lst = new List([val, ...this.value]);
    return new VmObject(lst);
  }

  /**
   * Returns a new list which results from deleting the element at the given index. 
   * @param vmIdx Index of element to remove
   * @returns New List
   */
  private removeElementAt(vmIdx: VmInt): VmObject {
    let idx = this.unpackIndex(vmIdx);
    if(idx < 0 || idx > this.value.length-1) throw('index out of range');
    let newValue = this.value.slice();
    newValue.splice(idx, 1);
    return new VmObject(new List(newValue));
  }

  /**
   * Returns a new list which results from deleting a range of elements.
   * @param vmStartIndex Start index
   * @param vmEndIndex End index (inclusive)
   * @returns New List
   */
  private removeRange(vmStartIndex: VmInt, vmEndIndex: VmInt): VmObject {
    let startIdx = this.unpackIndex(vmStartIndex);
    let endIdx = this.unpackIndex(vmEndIndex);
    if(startIdx < 0 || startIdx > this.value.length-1) throw('index out of range');
    if(endIdx < 0 || endIdx > this.value.length-1) throw('index out of range');
    if(endIdx < startIdx) throw('End index must be greater than or equal to start index');
    let count = endIdx - startIdx + 1;
    let newValue = this.value.slice();
    newValue.splice(startIdx, count);
    return new VmObject(new List(newValue));
  }

  /**
   * Returns a new list consisting of the elements of this list rearranged into a sorted order.
   * @param vmDescending `true` if descending, `nil` if ascending
   * @param vmFunc Optional comparison function
   * @returns New List
   */
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


  /**
   * Returns a new list which results from deleting elements starting at 
   * startIndex, then inserting any additional argument values as new list elements in their place. 
   * @param vmStartIndex Start index
   * @param vmDeleteCount Number of elements to delete
   * @param args Values to insert
   * @returns New List
   */
  private splice(vmStartIndex: VmInt, vmDeleteCount: VmInt, ...args: VmData[]): VmObject {
    let idx = this.unpackIndex(vmStartIndex);
    let deleteCount = vmDeleteCount.unpack();
    let values = this.value.concat([]);
    values.splice(idx, deleteCount, ...args);
    return new VmObject(new List(values));
  }

  /**
   * Creates and returns a new list consisting of a sublist of this list.
   * @param vmStartIndex Start index
   * @param vmLength Length of sublist
   * @returns New List
   */
  private sublist(vmStartIndex: VmInt, vmLength?: VmInt) : VmObject {
    let start = vmStartIndex.unpack() - 1;
    let length = vmLength ? vmLength.unpack() : null;

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

  /**
   * 
   * @param vmFunc 
   */
  private subset(vmFunc: VmData): VmObject {
    let lst: VmData[] = [];
    lst = this.value.filter((x) => {
      let r0 = vmFunc.invoke(x);
      return r0.isTruthy();
    });
    return new VmObject(new List(lst));
  }

  getValue() {
    return this.value;
  }  

}

MetaclassRegistry.register('list/030008', List);

export { List }