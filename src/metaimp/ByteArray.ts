const MD5 = require("crypto-js/md5");
const SHA256 = require("crypto-js/sha256");

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
      let start = args.length >= 2 ? args[1].unpack() - 1 : 0;
      let len = args.length >= 3 ? args[2].unpack() : arg0.length;
      let end = Math.min(start + len, arg0.length);
      this.value = arg0.slice(start, end);
    }
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('ByteArray: Cannot load from image');
  }  

  unpack(): any {
    return this.value;
  }

  getValue(): any {
    return this.value;
  }

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 0: return this.length;
      case 1: return this.subarray;
      case 2: return this.copyFrom;
      case 3: return this.fillValue;
      case 4: return this.mapToString;
      case 9: return this.sha256;
      case 10: return this.digestMD5;
    }
    return null;
  }  

  /*
   * Virtual methods implementation
   */
  
  public getindex(vmIndex: VmData): VmData {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unwrap();
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    return new VmInt(this.value[idx-1]);
  }     

  public setindex(vmIndex: VmData, data: VmData): VmObject {
    if(!(vmIndex instanceof VmInt)) throw('NUM_VAL_REQD');
    let idx = vmIndex.unwrap();
    if(idx < 1 || idx > this.value.length) throw('INDEX_OUT_OF_RANGE');
    this.value[idx - 1] = (data.unpack() & 0xff);
    return new VmObject(this);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    let str = '';
    for(let i = 0; i < this.value.length; i++) {
      str = str + String.fromCharCode(this.value[i]);
    }
    return str;
  }     

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * Copies bytes from sourceArray, which must be another ByteArray object.
   * @param vmSourceArray Source ByteArray
   * @param vmSourceIndex Source index
   * @param vmDestIndex Destination index
   * @param vmLen Number of bytes to copy.
   */
  private copyFrom(vmSourceArray: VmData, vmSourceIndex: VmInt, vmDestIndex: VmInt, vmLen: VmInt): VmData {
    // We slice the source array so that you can copy self to self, as well.
    let sourceArray = vmSourceArray.unpack().slice();
    let sourceIndex = vmSourceIndex.unpack() - 1;
    let destIndex = vmDestIndex.unpack() - 1;
    let len = vmLen.unpack();

    // There is no out-of-bounds protection.
    for(let i = 0; i < len; i++) {
      this.value[i + destIndex] = sourceArray[i + sourceIndex];
    }
    
    return null;
  }

  /**
   * Calculates the 128-bit RSA MD5 message digest of the string.
   * @returns hash string
   */
  private digestMD5(): VmObject {
    let hash = MD5(this.value).toString();
    return new VmObject(new MetaString(hash));
  }  

  /**
   * Stores the value val in each element of the array, starting 
   * at index startIndex and filling the next length bytes.
   * @param vmVal Value to store
   * @param vmStartIndex Optional start index
   * @param vmLength Optional length
   */
  private fillValue(vmVal: VmData, vmStartIndex?: VmData, vmLength?: VmData): VmData {
    let val = vmVal.unpack();
    let startIndex = vmStartIndex ? Math.max(0, vmStartIndex.unpack() - 1) : 0;
    let length = vmLength ? vmLength.unpack() : this.value.length;

    for(let i = startIndex; i < Math.min(startIndex + length, this.value.length); i++) {
      this.value[i] = (val & 0xff);
    }

    return null;
  }

  /**
   * Returns the number of bytes in the ByteArray. This is the 
   * same as the size specified when the object was created. 
   * @returns Length of ByteArray
   */
  private length(): VmData {
    return new VmInt(this.value.length);
  }

  /**
   * Maps the bytes in the array to a string.
   * @param vmCharset Optional charset object to use (currently ignored)
   * @param vmStartIndex Optional start index
   * @param vmLength Optional length
   * @returns New MetaString
   */
  private mapToString(vmCharset?: VmObject, vmStartIndex?: VmInt, vmLength?: VmInt): VmObject {
    // Charset is ignored.
    let start = vmStartIndex ? vmStartIndex.unpack() - 1 : 0;
    let len = vmLength ? vmLength.unpack() : this.value.length;
    let end = Math.min(start + len, this.value.length);

    let str = '';
    for(let i = start; i < end; i++) {
      str = str + String.fromCharCode(this.value[i]);
    }

    return new VmObject(new MetaString(str));
  }

  /**
   * Calculates the 256-bit SHA-2 (Secure Hash Algorithm 2) hash of the string.
   * @returns hash string
   */
  private sha256(): VmObject {
    let hash = SHA256(this.value).toString();
    return new VmObject(new MetaString(hash));
  }      

  /**
   * Returns a new ByteArray consisting of a region of this array.
   * @param vmStartIndex Start index
   * @param vmLength Optional length
   * @returns new ByteArray
   */
  private subarray(vmStartIndex: VmInt, vmLength?: VmInt): VmObject {
    vmLength = vmLength ?? new VmInt(this.value.length);
    // Uses ByteArray constructor:
    return new VmObject(new ByteArray(new VmObject(this), vmStartIndex, vmLength));
  }
}

MetaclassRegistry.register('bytearray/030002', ByteArray);