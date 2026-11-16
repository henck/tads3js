import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmNil, VmTrue, VmNativeCode } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";


abstract class Iterator extends RootObject {
  /**
   * Create a new Iterator. 
   */
  constructor() {
    super();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    throw('Iterator: Cannot load from image');
  }  

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("Iterator.getNext", this.meta_getNext);
      case 1: return new VmNativeCode("Iterator.isNextAvailable", this.meta_isNextAvailable);
      case 2: return new VmNativeCode("Iterator.resetIterator", this.meta_resetIterator);
      case 3: return new VmNativeCode("Iterator.getCurKey", this.meta_getCurKey);
      case 4: return new VmNativeCode("Iterator.getCurVal", this.meta_getCurVal);
    }
    return null;
  }

  iter_next(): VmData {
    if(this.isNextAvailable() instanceof VmTrue) {
      return this.getNext();
    }
    return null;
  }

  protected abstract resetIterator(): VmData;

  protected abstract isNextAvailable(): VmTrue | VmNil; 

  protected abstract getNext(): VmData;

  protected abstract getCurKey(): VmData;

  protected abstract getCurVal(): VmData;  

  /*
   * Virtual methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected meta_resetIterator(): VmData {
    return this.resetIterator();
  }

  protected meta_isNextAvailable(): VmTrue | VmNil {
    return this.isNextAvailable();
  }

  protected meta_getNext(): VmData {
    return this.getNext();
  }

  protected meta_getCurKey(): VmData {
    return this.getCurKey();
  }

  protected meta_getCurVal(): VmData {
    return this.getCurVal();
  }

  
}

MetaclassRegistry.register('iterator/030001', Iterator);

export { Iterator }