import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from './MetaString';



export class ByteArray extends Metaclass {
  private value: number[];

  // new ByteArray(native str)
  // new ByteArray(vmInt)
  // new ByteArray(vmStr)
  // new ByteArray(vmStr, vmStr)
  // new ByteArray(ByteArray, vmInt, vmInt)
  constructor(...args: any[]) {
    super();
    this.value = [];

    if(args.length == 0) throw('ByteArray: not enough arguments');

    // If a native string, convert it to a MetaString.
    if(typeof(args[0]) == 'string') {
      args[0] = new VmObject(new MetaString(args[0]));
    }

    let arg0 = args[0].unpack();
    // If a number, then create an empty ByteArray with _n_ 
    // elements of value 0.
    if(typeof(arg0) == 'number') {
      this.value = this.value.fill(0, 0, arg0);
    }
    // If a string, create a ByteArray with Unicode chars 
    // from string.
    else if(typeof(arg0) == 'string') {
      this.value = arg0.split('').map((c) => c.charCodeAt(0));
    } 
    // If an array (another ByteArray), then make a copy
    // of a segment of it.
    else if(Array.isArray(arg0)) {
      let start = args[1].unpack();
      let len = args[2].unpack();
      for(let i = 0; i < len; i++) {
        this.value.push(arg0[start+i]);
      }
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('ByteArray: Cannot load from image');
  }  

  unpack(): any {
    return this.value;
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