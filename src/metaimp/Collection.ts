import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject } from "../types";
import { Iterator } from "./Iterator";

export abstract class Collection extends Metaclass {
  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.createIterator;
      case 1: return this.createLiveIterator;
    }
    return null;
  }  

  protected abstract makeIterator(live: boolean): Iterator;

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private createIterator(): VmObject {
    return new VmObject(this.makeIterator(false));
  }

  private createLiveIterator(): VmObject {
    return new VmObject(this.makeIterator(true));
  }
}

MetaclassRegistry.register('collection/030000', Collection);
