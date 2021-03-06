import { VmData, VmInt, VmObject, VmNil, VmList } from "../types"
import { Collection } from "./Collection"
import { MetaString } from "./MetaString"
import { Iterator } from "./Iterator";
import { IndexedIterator } from "./IndexedIterator";

abstract class ListBase extends Collection {
  protected value: VmData[];

  public getValue() {
    return this.value;
  }  

  public setValue(value: VmData[]) {
    this.value = value; 
  }

  public unpack() {
    return this.value;
  }

  /**
   * Helper method. Unpacks a list-like index. If the index is negative,
   * it wraps around from the end of the list.
   * @param vmIndex Index
   * @returns Clamped index
   */
  protected unpackIndex(vmIndex: VmInt): number {
    let idx = vmIndex.unpack();
    idx = idx <= 0 ? this.value.length + idx : idx - 1;
    return idx;
  }     

  public makeIterator(live: boolean): Iterator {
    return new IndexedIterator(live ? this.value : this.value.slice());
  }

  /*
   * Virtual methods
   */

  equals(data: VmData, depth?: number): boolean {
    // Cancel equals check after 256 stack levels. 
    // This happens when list elements point back to the parent list.
    depth = depth ?? 0;
    if(depth > 256) return false;

    // Check that other object is also a list-like.
    let arr = data.unpack();
    if(!Array.isArray(arr)) return false;

    // Lists must have same length to be equal.
    if(this.value.length != arr.length) return false;

    // Check elements of objects for equality
    // by calling "eq" on them.
    for(let i = 0; i < this.value.length; i++) {
      if (!this.value[i].eq(arr[i], depth + 1)) return false;
    }    
    return true;
  }   

  public getindex(vmIndex: VmData): VmData {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unpack();
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    return this.value[idx-1];    
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value.map((x: VmData) => x.toStr(radix, isSigned)).join(',');
  }     

  /*
   * Meta methods - all protected as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  //
  // makeUnique is a helper method called by other meta methods.
  //
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

  /**
   * Returns number of occurrences of value in self.
   * @param vmVal Value to find
   */
  protected countOf(vmVal: VmData): VmInt {
    // Comparison is done using eq for recursion.
    return new VmInt(this.value.filter((x) => x.eq(vmVal)).length);
  }

  /**
   * Returns number of elements in self for which callback returns a truthy value.
   * @param vmFunc Callback
   */
  protected countWhich(vmFunc: VmData): VmInt {
    let lst = this.value.filter((x) => vmFunc.invoke(x).isTruthy());
    return new VmInt(lst.length);
  }

  /**
   * Invokes callback function for each element.
   * @param vmFunc Callback function
   * @returns null
   */
  protected forEach(vmFunc: VmData): VmObject {
    this.value.forEach((x) => vmFunc.invoke(x));
    return null;
  }

  /**
   * Invokes the callback function `(func)(index, value)` for each element, in order 
   * from first to last, passing each element's index and value to the function `func`. 
   * @param vmFunc Callback function
   * @returns null
   */
  protected forEachAssoc(vmFunc: VmData): VmObject {
    this.value.forEach((v, i) => vmFunc.invoke(new VmInt(i+1), v));
    return null;
  }  

  /**
   * Returns index of first element equal to `val`, or
   * `nil` if no match.
   * @param vmVal Value to look far
   * @returns index, or `nil`
   */
  protected indexOf(vmVal: VmData) : VmInt | VmNil {
    let pos = this.value.findIndex((x: VmData) => x.eq(vmVal));
    return pos == -1 ? new VmNil() : new VmInt(pos + 1);
  }

  /**
   * Returns the index of the element with the maximum value, or
   * nil if no elements.
   * @param vmFunc Optional comparison function
   * @returns index, or `nil`
   */
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

  /**
   * Returns the index of the element with the minimum value, or
   * nil if no elements.
   * @param vmFunc Optional comparison function
   * @returns index, or `nil`
   */  
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

  /**
   * Finds the first element for which the given condition is true.
   * @param vmFunc Callback function
   * @returns Index of element, of `nil` if not found.
   */
  protected indexWhich(vmFunc: VmData): VmInt {
    let idx = this.value.findIndex((x) => vmFunc.invoke(x).isTruthy());
    if(idx == -1) return new VmNil();
    return new VmInt(idx + 1); // T3 index 1-based
  }  

  /**
   * Returns a string made by concatenating the elements of self 
   * together in index order.
   * @param vmSep Optional separator
   * @returns Joined string
   */
  protected join(vmSep?: VmData) : VmObject {
    let sep = vmSep ? vmSep.unpack() : '';
    let str = this.value.map((x) => x.toStr()).join(sep);
    return new VmObject(new MetaString(str));
  }

  /**
   * Returns the index of the last element in the vector whose value equals `val`.
   * @param vmVal Value to look for
   * @returns Index of element, or nil if not found
   */
  protected lastIndexOf(vmVal: VmData) : VmInt | VmNil {
    let pos = this.value.slice().reverse().findIndex((x: VmData) => x.eq(vmVal));
    pos = pos >= 0 ? (this.value.length - 1) - pos : pos;
    return pos == -1 ? new VmNil() : new VmInt(pos + 1);
  }  

  /**
   * Finds the last element for which the given condition is true.
   * @param vmFunc Callback
   * @returns Index of element, or nil if not found
   */
  protected lastIndexWhich(vmFunc: VmData): VmInt {
    let idx = this.value.slice().reverse().findIndex((x) => vmFunc.invoke(x).isTruthy());
    if(idx == -1) return new VmNil();
    return new VmInt(this.value.length - idx); // T3 index 1-based
  }  

  /**
   * Finds the last element for which the given condition is true, 
   * and returns the element's value.
   * @param vmFunc Callback
   * @returns Value of element, or nil if not found.
   */
  protected lastValWhich(vmFunc: VmData): VmData {
    let val = this.value.slice().reverse().find((x) => vmFunc.invoke(x).isTruthy());
    if(!val) return new VmNil();
    return val;
  }

  /**
   * Returns an integer giving the number of elements in self.
   * @returns Number of elements
   */
  protected length(): VmData {
    return new VmInt(this.value.length);
  }  

  /**
   * Returns the maximum of the element values in self.
   * @param vmFunc Optional modifier function
   * @returns Maximum value, or nil if no values
   */
  protected maxVal(vmFunc?: VmData): VmData {
    let max: VmData = this.value.reduce(function(a:VmData,b:VmData) {
      let aVal: VmData = vmFunc ? vmFunc.invoke(a) : a;
      let bVal: VmData = vmFunc ? vmFunc.invoke(b) : b;
      return aVal.lt(bVal) ? b : a;
    });
    return max;
  }

  /**
   * Returns the maximum of the element values in self.
   * @param vmFunc Optional modifier function
   * @returns Minimum value, or nil if no values
   */
  protected minVal(vmFunc?: VmData): VmData {
    let max: VmData = this.value.reduce(function(a:VmData,b:VmData) {
      let aVal: VmData = vmFunc ? vmFunc.invoke(a) : a;
      let bVal: VmData = vmFunc ? vmFunc.invoke(b) : b;
      return aVal.lt(bVal) ? a : b;
    });
    return max;
  }

  /**
   * Returns the value of the first element for which the callback 
   * function returns a non-false value.
   * @param vmFunc Callback function
   * @returns Element, or nil
   */
  protected valWhich(vmFunc: VmData): VmData {
    let val = this.value.find((x) => vmFunc.invoke(x).isTruthy());
    return val ?? new VmNil();
  }
}

export { ListBase }