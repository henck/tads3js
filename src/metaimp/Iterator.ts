import { RootObject, TPropFunc } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmNil, VmTrue } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";


export abstract class Iterator extends RootObject {
  /**
   * Create a new Iterator. 
   */
  constructor() {
    super();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('Iterator: Cannot load from image');
  }  

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.meta_getNext;
      case 1: return this.meta_isNextAvailable;
      case 2: return this.meta_resetIterator;
      case 3: return this.meta_getCurKey;
      case 4: return this.meta_getCurVal;
    }
    return null;
  }

  iter_next(): VmData {
    if(this.isNextAvailable()) {
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