import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNil, VmTrue, VmList, VmNativeCode, VmEmpty } from "../types"
import { Collection } from "./Collection"
import { Iterator } from "./Iterator"
import { ListBase } from "./ListBase"
import { List } from "./List"
import { VmMap } from "./VmMap"
import { LookupTableIterator } from './LookupTableIterator'
import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool'
import { RootObject } from '../metaclass/RootObject'
import { DataFactory } from '../types'

class LookupTable extends Collection  {
  private value: VmMap;
  private default: VmData;

  // new LookupTable()
  // new LookupTable(bucket, capacity)
  // new LookupTable(listlike)
  constructor(...args: VmData[]) {
    super();
    this.default = new VmNil();
    this.value = new VmMap([], []);
    
    // Parse arguments
    if(args.length == 0) return; // No arguments
    let arg = args[0]; 
    let list: VmData[] = null;
    if(arg instanceof VmInt) return null;  // Bucket argument? Ignore
    // Any type of list:
    else if(arg instanceof VmList) list = arg.value;
    else if(arg instanceof VmObject && arg.getInstance() instanceof ListBase) list = arg.getInstance().getValue();
    else throw('List-like argument expected');
    
    // A list of odd length has a default value as its last entry.
    // Use it and shorten (a copy of) the list.
    if(list.length % 2 == 1) {
      this.default = list[list.length-1];
      list = list.slice(0, list.length-1);
    }

    // Insert values into Map:
    for(let i = 0; i < list.length; i += 2) {
      this.value.set(list[i], list[i+1]);
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let table = new LookupTable();
    let bucket_count = image.getUInt16(offset); offset += 2;
    let value_count = image.getUInt16(offset); offset += 2;
    let first_free_index = image.getUInt16(offset); offset += 2;
    // Skip bucket indices:
    for(let i = 0; i < bucket_count; i++) offset += 2;
    // Read values:
    for(let i = 0; i < value_count; i++) {
      let type = image.getUInt8(offset); offset++;
      let offsetOrValue = image.getUInt32(offset); offset += 4;
      let key = DataFactory.load(type, dataPool, offsetOrValue);
      type = image.getUInt8(offset); offset++;
      offsetOrValue = image.getUInt32(offset); offset += 4;
      let value = DataFactory.load(type, dataPool, offsetOrValue);
      offset += 2; // Skip next_index
      if(key instanceof VmEmpty) continue;
      table.value.set(key, value);
    }

    return table;
  }


  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return  new VmNativeCode("LookupTable.isKeyPresent", this.isKeyPresent, 1);
      case 1: return  new VmNativeCode("LookupTable.removeElement", this.removeElement, 1);
      case 2: return  new VmNativeCode("LookupTable.applyAll", this.applyAll, 1);
      case 3: return  new VmNativeCode("LookupTable.forEach", this.forEach, 1);
      case 4: return  new VmNativeCode("LookupTable.getBucketCount", this.getBucketCount, 0);
      case 5: return  new VmNativeCode("LookupTable.getEntryCount", this.getEntryCount, 0);
      case 6: return  new VmNativeCode("LookupTable.forEachAssoc", this.forEachAssoc, 1);
      case 7: return  new VmNativeCode("LookupTable.keysToList", this.keysToList, 0);
      case 8: return  new VmNativeCode("LookupTable.valsToList", this.valsToList, 0);
      case 9: return  new VmNativeCode("LookupTable.getDefaultValue", this.getDefaultValue, 0);
      case 10: return new VmNativeCode("LookupTable.setDefaultValue", this.setDefaultValue, 1);
      case 11: return new VmNativeCode("LookupTable.nthKey", this.nthKey, 1);
      case 12: return new VmNativeCode("LookupTable.nthVal", this.nthVal, 1);
    }
    return super.getMethodByIndex(idx);
  }    

  unpack() {
    return this.value;
  }

  getValue() {
    return this.value;
  }  

  public makeIterator(live: boolean): Iterator {
    return new LookupTableIterator(live ? this.value : this.value.clone());
  }

  /*
   * Virtual methods
   */

  public getindex(vmIndex: VmData): VmData {
    let val = this.value.get(vmIndex);
    return val ?? this.default;
  }     

  public setindex(vmIndex: VmData, data: VmData): VmObject {
    // If vector isn't big enough, add nil elements to the end:
    this.value.set(vmIndex, data);
    return new VmObject(this);
  }


  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * For each element in the table, this method invokes the callback function, 
   * and then changes the element's value to the return value of the function.
   * @param vmFunc Callback function
   * @returns VmNil
   */
  private applyAll(vmFunc: VmData): VmNil {
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      let newVal = vmFunc.invoke(val);
      this.value.set(k, newVal);
    });
    return new VmNil();
  }


  /**
   * For each element in the table, invokes the callback function with value.
   * @param vmFunc Callback function
   * @returns VmNil
   */
  private forEach(vmFunc: VmData): VmNil {
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      vmFunc.invoke(val);
    });
    return new VmNil();
  }

  /**
   * For each element in the table, invokes the callback function with 
   * index and value.
   * @param vmFunc Callback function
   * @returns VmNil
   */
  private forEachAssoc(vmFunc: VmData): VmNil {
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      vmFunc.invoke(k, val);
    });
    return new VmNil();
  }  

  /**
   * Returns the number of "hash buckets" in the table.
   * @returns Number of buckets
   */
  private getBucketCount(): VmInt {
    return new VmInt(1);
  }

  /**
   * Returns the table's default value.
   * @returns Default value
   */
  private getDefaultValue(): VmData {
    return this.default;
  }

  /**
   * Returns the number of key/value entries in the table.
   * @returns Number of entries
   */
  private getEntryCount(): VmInt {
    return new VmInt(this.value.size());
  }

  /**
   * Checks to see if an entry with the given key is present in the table.
   * @param key Key
   * @returns True is key is present, nil if not.
   */
  private isKeyPresent(key: VmData): VmNil | VmTrue {
    return this.value.has(key) ? new VmTrue() : new VmNil();
  }

  /**
   * Returns a list consisting of all of the keys in the table. 
   * @returns List of keys
   */
  private keysToList(): VmObject {
    return new VmObject(new List(this.value.keys()));
  }

  /**
   * Returns the key at the given index in the table. 
   * @param vmN Index
   * @returns Key
   */
  private nthKey(vmN: VmInt): VmData {
    let n = vmN.unpack(); n--;
    if(n < 0 || n >= this.value.size()) throw('Out of bounds');
    return this.value.keys()[n];
  }

  /**
   * Returns the value at the given index in the table. 
   * @param vmN Index
   * @returns Value
   */
  private nthVal(vmN: VmInt): VmData {
    let n = vmN.unpack(); n--;
    if(n < 0 || n >= this.value.size()) throw('Out of bounds');
    return this.value.values()[n];
  }

  /**
   * Removes the element with the given key, if any, returning the value.
   * @param key 
   * @returns Deleted value, or VmNil
   */
  private removeElement(key: VmData): VmData {
    return this.value.delete(key);
  }

  /**
   * Sets the default value for the table.
   * @param value Value
   */
  private setDefaultValue(value: VmData): VmNil {
    this.default = value;
    return new VmNil();
  }

  /**
   * Returns a list consisting of all of the values in the table. 
   * @returns List of values
   */
  private valsToList(): VmObject {
    return new VmObject(new List(this.value.values()));
  }




}

MetaclassRegistry.register('lookuptable/030003', LookupTable);


export { LookupTable }