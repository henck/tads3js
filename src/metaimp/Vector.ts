import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmList, VmNil } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { List } from "./List";
import { ListBase } from "./ListBase";

export class Vector extends ListBase {

  constructor(a?: VmData[] | VmData, b?: VmData) {
    super();

    this.value = [];

    // No arguments?
    if(!a) return;

    // If the first argument is a VmInt, then it is the allocation 
    // size. We ignore this, so we move to b.
    if(a instanceof VmInt) a = b;

    // The other argument can be a constant list, metalist, Vector
    // or a number indicating the number of nil values to fill the new
    // Vector with. Or, for convenience, an array of VmData.
    if(Array.isArray(a)) {
      // A simple array:
      this.value = a;
    }
    else if(a instanceof VmList) {
      // Copy from constant list:
      this.value = a.value.slice();
    } else if(a instanceof VmObject && a.getInstance() instanceof ListBase) {
      // Copy from list-like metaclass instance:
      this.value = a.getInstance().getValue().slice();
    } else if(a instanceof VmInt) {
      // Fill with nil values:
      for(let i = 0; i < a.value; i++) {
        this.value.push(new VmNil());
      }
    } else {
      // Disallowed constructor parameter:
      throw('Cannot instantiate Vector with parameter: ' + a.toString());
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    return new Vector();    
  }  

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.toList;
      case 1: return this.length;
      case 2: return this.copyFrom;
      case 3: return this.fillValue;
      case 4: return this.subset;
      case 5: return this.applyAll;
      case 6: return this.indexWhich;
      case 7: return this.forEach;
      case 8: return this.forEachAssoc;
      case 9: return this.mapAll;
      case 10: return this.indexOf;
      case 11: return this.valWhich;
      case 12: return this.lastIndexOf;
      case 13: return this.lastIndexWhich;
      case 14: return this.lastValWhich;
      case 15: return this.countOf;
      case 16: return this.countWhich;
      case 17: return this.getUnique;
      case 18: return this.appendUnique;
      case 19: return this.sort;
      case 20: return this.setLength;
      case 21: return this.insertAt;
      case 22: return this.removeElementAt;
      case 23: return this.removeRange;
      case 24: return this.append;
      case 25: return this.prepend;
      case 26: return this.appendAll;
      case 27: return this.removeElement;
      case 28: return this.splice;
      case 29: return this.join;
      case 30: return this.generate;
      case 31: return this.indexOfMin;
      case 32: return this.minVal;
      case 33: return this.indexOfMax;
      case 34: return this.maxVal;
    }
    return null;
  }  

  /*
   * Virtual methods
   */  
  
  public add(data: VmData): VmData {
    let values = [data];
    if(data instanceof VmList) values = data.value;
    if(data instanceof VmObject && data.getInstance() instanceof ListBase) values = data.getInstance().getValue();
    return new VmObject(new Vector(this.value.concat(values)));
  }

  public subtract(data: VmData): VmData {
    let values = [data];
    if(data instanceof VmList) values = data.value;
    if(data instanceof VmObject && data.getInstance() instanceof ListBase) values = data.getInstance().getValue();    
    return new VmObject(new Vector(this.value.filter((v) => !values.find((w) => w.eq(v)))));
  }
  
  public setindex(vmIndex: VmData, data: VmData): VmObject {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unpack();
    if(idx < 1) throw('INDEX_OUT_OF_RANGE');
    // If vector isn't big enough, add nil elements to the end:
    while(this.value.length < idx) this.value.push(new VmNil());
    this.value[idx - 1] = data;
    return new VmObject(this);
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * Append vmValue to end of vector. Mutates self.
   * List-like values are appended as single elements.
   * @param vmValue Value to append.
   * @returns self
   */
  private append(vmValue: VmData): VmObject {
    this.value.push(vmValue);
    return new VmObject(this);
  }

  /**
   * Append vmValue to end of vector. Mutates self.
   * List-like values are appended as separate elements (non-recursively).
   * @param vmValue Value to append
   * @returns self
   */
  private appendAll(vmValue: VmData): VmObject {
    if(vmValue instanceof VmList) {
      this.value.push(...vmValue.value);
    } else if((vmValue instanceof VmObject) && vmValue.getInstance() instanceof ListBase) {
      this.value.push(...vmValue.getInstance().getValue());
    } else {
      this.value.push(vmValue);
    }
    return new VmObject(this);
  }

  /**
   * Append elements of list or vector to self. Result
   * consists only of unique elements. Mutates self.
   * @param vmList List/vector
   * @returns self
   */
  private appendUnique(vmList: VmData): VmObject {
    let lst = vmList.unpack();
    let values = (lst instanceof ListBase) ? lst.getValue() : lst; 
    this.value = this.makeUnique([...this.value, ...values]);
    return new VmObject(this);    
  }

  /**
   * Modifies all elements of this vector with a modifier function that
   * takes a single argument.
   * @param vmFunc Modifier function
   * @returns self
   */
  private applyAll(vmFunc: VmData) {
    this.value = this.value.map((x) => vmFunc.invoke(x));
    return new VmObject(this);
  }

  /**
   * Copies values from another list/vector into self. Mutates self.
   * @param vmSource Source list/vector
   * @param vmSourceStart Source index
   * @param vmDestStart Destination index
   * @param vmCount Number of elements to copy
   * @returns self
   */
  private copyFrom(vmSource: VmData, vmSourceStart: VmInt, vmDestStart: VmInt, vmCount: VmInt): VmObject {
    let sourceStart = this.unpackIndex(vmSourceStart);
    let destStart = this.unpackIndex(vmDestStart);
    let count = vmCount.unpack();

    let other = undefined;
    if(vmSource instanceof VmList) other = vmSource.value;
    if(vmSource instanceof VmObject && vmSource.getInstance() instanceof ListBase) other = vmSource.getInstance().getValue();
    if(!other) throw('LIST OR VECTOR REQD');
    
    for(let i = 0; i < count; i++) {
      this.value[destStart + i] = other[sourceStart + i];
    }

    return new VmObject(this);
  }

  /**
   * Fills elements of vector with value. Mutates self.
   * @param vmVal Value to fill with
   * @param vmStart Start index
   * @param vmCount Number of elements
   * @returns self
   */
  private fillValue(vmVal: VmData, vmStart?: VmInt, vmCount?: VmInt): VmObject {
    let start = this.unpackIndex(vmStart);
    let count = vmCount 
      ? vmCount.unpack() 
      : Math.max(this.value.length - start, 0);
    
    for(let i = 0; i < count; i++) {
      this.value[i + start] = vmVal;
    }
   
    return new VmObject(this);
  }

  /**
   * Creates a new Vector containing n elements by invoking the callback function 
   * once for each element, and using the return value as the element value. 
   * @param vmFunc Callback function
   * @param vmN Number of elements to create
   */
  private generate(vmFunc: VmData, vmN: VmData): VmObject {
    let n = vmN.unpack();
    if(n <= 0) n = 0;

    let arr = [];
    for(let i = 1; i <= n; i++) {
      let numParams = vmFunc.funcinfo().params;
      let args = [];
      if(numParams > 0) args.push(new VmInt(i));
      arr.push(vmFunc.invoke(...args));
    }

    return new VmObject(new Vector(arr));
  }

  /**
   * Returns a new vector consisting of the unique elements of the original vector.
   * @returns New vector
   */
  private getUnique(): VmObject {
    let value = this.makeUnique(this.value);
    return new VmObject(new Vector(value));
  }

  /**
   * Inserts one or more values into the vector at the given starting index.
   * @param vmIndex Index
   * @param args One or more values
   */
  private insertAt(vmIndex: VmInt, ...args: VmData[]): VmObject {
    let idx = this.unpackIndex(vmIndex);
    this.value.splice(idx, 0, ...args);
    return new VmObject(this);
  }

  /**
   * Creates a new vector consisting of the results of applying the callback function 
   * to each element of the original vector.
   * @param vmFunc Callback function
   * @returns New vector
   */
  private mapAll(vmFunc: VmData): VmObject {
    return new VmObject(new Vector(this.value.map((x) => vmFunc.invoke(x))));
  }

  /**
   * Inserts a value before the first element of the vector. Mutates the vector.
   * @param vmVal Value to prepend.
   * @returns self
   */
  private prepend(vmVal: VmData): VmObject {
    this.value.unshift(vmVal);
    return new VmObject(this);
  }

  /**
   * Remove each vector element whose value equals `val` from the vector. Mutates vector.
   * @param vmVal Value to compare to
   * @returns self
   */
  private removeElement(vmVal: VmData): VmObject {
    this.value = this.value.filter((x) => !x.eq(vmVal));
    return new VmObject(this);
  }

  /**
   * Deletes one element from the vector at the given index. Mutates vector.
   * @param vmIdx Index of element to delete.
   * @returns self
   */
  private removeElementAt(vmIdx: VmInt): VmObject {
    let idx = this.unpackIndex(vmIdx);
    if(idx < 0 || idx > this.value.length-1) throw('index out of range');
    this.value.splice(idx, 1);
    return new VmObject(this);
  }

  /**
   * Deletes elements from the vector from startingIndex through and including endingIndex.
   * Mutates vector.
   * @param vmStartIndex Start index
   * @param vmEndIndex End index (inclusive)
   * @returns self
   */
  private removeRange(vmStartIndex: VmInt, vmEndIndex: VmInt): VmObject {
    let startIdx = this.unpackIndex(vmStartIndex);
    let endIdx = this.unpackIndex(vmEndIndex);
    if(startIdx < 0 || startIdx > this.value.length-1) throw('index out of range');
    if(endIdx < 0 || endIdx > this.value.length-1) throw('index out of range');
    if(endIdx < startIdx) throw('End index must be greater than or equal to start index');
    let count = endIdx - startIdx + 1;
    this.value.splice(startIdx, count);
    return new VmObject(this);
  }

  /**
   * Sets the number of elements of the vector to newLength. Mutates vector.
   * @param vmLength New length
   * @returns self
   */
  private setLength(vmLength: VmInt): VmObject {
    let length = vmLength.unpack();
    // Add nil values if shorter than requested length.
    while(this.value.length < length) this.value.push(new VmNil());
    // Discard values if longer than requested length.
    this.value.length = length;
    return new VmObject(this);
  }

  /**
   * Re-orders the elements of the vector into sorted order. Mutates vector.
   * @param vmDescending `true` if descending, `nil` (or omit) if ascending
   * @param vmFunc Comparison function
   * @returns self
   */
  private sort(vmDescending?: VmData, vmFunc?: VmData): VmObject {
    // Descending is false if unspecified, or VmNil, or VmInt=0
    let descending = (!vmDescending || vmDescending.isFalsy()) ? false : true;

    // Sort in place, either by comparing elements or by calling 
    // a callback with two arguments.
    this.value.sort((a: VmData, b: VmData) => {
      if(vmFunc) {
        return vmFunc.invoke(a, b).value;
      } else {
        return a.lt(b) ? -1 : 1;
      }
    });

    // If descending, reverse result in place.
    if(descending) this.value.reverse();

    return new VmObject(this);
  }

  /**
   * Splices elements into the vector, by replacing a given range of elements 
   * with a set of new elements. Mutates vector.
   * @param vmStartIndex Start index
   * @param vmDeleteCount Number of elements to delete
   * @param args Values to insert
   * @returns self
   */
  private splice(vmStartIndex: VmInt, vmDeleteCount: VmInt, ...args: VmData[]): VmObject {
    let idx = this.unpackIndex(vmStartIndex);
    let deleteCount = vmDeleteCount.unpack();
    this.value.splice(idx, deleteCount, ...args);
    return new VmObject(this);
  }

  /**
   * Creates and returns a new vector containing the elements of this vector 
   * for which the callback function returns a non-false value. Mutates vector.
   * @param vmFunc Callback function
   * @returns self
   */
  private subset(vmFunc: VmData): VmObject {
    this.value = this.value.filter((x) => vmFunc.invoke(x).isTruthy());
    return new VmObject(this);
  } 

  /**
   * Creates and returns a new list value based on the vector.
   * @param vmStartIdx Start index
   * @param vmCount Number of elements
   * @returns New List
   */
  private toList(vmStartIdx?: VmInt, vmCount?: VmInt): VmObject {
    let startIdx = vmStartIdx ? vmStartIdx.unpack() : null;
    if(startIdx == null) startIdx = 1;
    startIdx--;
    let count = vmCount ? vmCount.unpack() : null;
    let lst = new List(this.value.slice(startIdx, count ? (startIdx + count) : undefined));
    return new VmObject(lst);
  }
}

MetaclassRegistry.register('vector/030005', Vector);