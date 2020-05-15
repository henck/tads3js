import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";



export class ByteArray extends Metaclass {
  private value: number[];

  constructor(str?: string) {
    super();
    this.value = [];
    if(str) {
      for(let i = 0; i < str.length; i++) {
        this.value.push(str.charCodeAt(i));
      }
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('ByteArray: Cannot load from image');
  }  

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.length;
    }
    return null;
  }  

  /*
   * Virtual methods implementation
   */
  
   

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */
  
  private length(): VmData {
    return new VmInt(this.value.length);
  }
}

MetaclassRegistry.register('bytearray/030002', ByteArray);