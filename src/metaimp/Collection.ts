import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject, VmNativeCode } from "../types";
import { Iterator } from "./Iterator";

abstract class Collection extends RootObject {
  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("Collection.createIterator", this.createIterator);
      case 1: return new VmNativeCode("Collection.createLiveIterator", this.createLiveIterator);
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

export { Collection }