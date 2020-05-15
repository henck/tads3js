import { Metaclass, TPropFunc } from '../metaclass/Metaclass'
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNil, VmTrue, VmList } from "../types"
import { Vm } from "../Vm"
import { Collection } from "./Collection"
import { Iterator } from "./Iterator"
import { ListBase } from "./ListBase"
import { List } from "./List"
import { VmMap } from "./VmMap"
import { LookupTableIterator } from './LookupTableIterator'

export class LookupTable extends Collection  {
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

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.isKeyPresent;
      case 1: return this.removeElement;
      case 2: return this.applyAll;
      case 3: return this.forEach;
      case 4: return this.getBucketCount;
      case 5: return this.getEntryCount;
      case 6: return this.forEachAssoc;
      case 7: return this.keysToList;
      case 8: return this.valsToList;
      case 9: return this.getDefaultValue;
      case 10: return this.setDefaultValue;
      case 11: return this.nthKey;
      case 12: return this.nthVal;
    }
    return super.getMethodByIndex(idx);
  }    

  getValue() {
    return this.value;
  }  

  public makeIterator(live: boolean): Iterator {
    return new LookupTableIterator(live ? this.value : this.value.clone());
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private getBucketCount(): VmInt {
    return new VmInt(1);
  }

  private getEntryCount(): VmInt {
    return new VmInt(this.value.size());
  }

  private keysToList(): VmObject {
    return new VmObject(new List(this.value.keys()));
  }

  private valsToList(): VmObject {
    return new VmObject(new List(this.value.values()));
  }

  private getDefaultValue(): VmData {
    return this.default;
  }

  private setDefaultValue(value: VmData): VmData {
    this.default = value;
    return new VmNil();
  }

  private removeElement(key: VmData): VmData {
    return this.value.delete(key);
  }

  private isKeyPresent(key: VmData): VmNil | VmTrue {
    return this.value.has(key) ? new VmTrue() : new VmNil();
  }

  private nthKey(vmN: VmInt): VmData {
    let n = vmN.unwrap(); n--;
    if(n < 0 || n >= this.value.size()) throw('Out of bounds');
    return this.value.keys()[n];
  }

  private nthVal(vmN: VmInt): VmData {
    let n = vmN.unwrap(); n--;
    if(n < 0 || n >= this.value.size()) throw('Out of bounds');
    return this.value.values()[n];
  }

  private applyAll(vmFunc: VmData): VmData {
    let func = vmFunc.unwrap();
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      let newVal = vmFunc.invoke(val);
      this.value.set(k, newVal);
    });
    return new VmNil();
  }

  private forEach(vmFunc: VmData): VmData {
    let func = vmFunc.unwrap();
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      vmFunc.invoke(val);
    });
    return new VmNil();
  }

  private forEachAssoc(vmFunc: VmData): VmData {
    let func = vmFunc.unwrap();
    this.value.keys().map((k) => {
      let val = this.value.get(k);
      vmFunc.invoke(k, val);
    });
    return new VmNil();
  }  
}

MetaclassRegistry.register('lookuptable/030003', LookupTable);
