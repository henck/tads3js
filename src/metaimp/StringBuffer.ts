import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNativeCode } from "../types";
import { MetaString } from "./MetaString";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";

class StringBuffer extends RootObject {
  // The value of a StringBuffer is an array of characters.
  private value: string[];
  
  // size and incrementalsize are stored, but not used in this JavaScript implementation.
  private size: number;
  private incrementalSize: number;

  constructor(vmSize?: VmInt, vmIncrementalSize?: VmInt) {
    super();
    this.value = [];
    this.size = vmSize ? vmSize.value : 0;
    this.incrementalSize = vmIncrementalSize ? vmIncrementalSize.value : 0;
  }

  unpack(): string { 
    return this.value.join('');
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode(this.length);
      case 1: return new VmNativeCode(this.charAt);
      case 2: return new VmNativeCode(this.append);
      case 3: return new VmNativeCode(this.insert);
      case 4: return new VmNativeCode(this.copyChars);
      case 5: return new VmNativeCode(this.deleteChars);
      case 6: return new VmNativeCode(this.splice);
      case 7: return new VmNativeCode(this.substr);
    }
    return null;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('StringBuffer: Cannot load from image');
  }  

  public getValue() {
    return this.value.join('');
  }  

  public toString() {
    return this.value.join('');
  }

  /*
   * Virtual methods implementation
   */

  // TODO: Operators?

  public equals(data: VmData): boolean {
    let str = data.unpack();
    return this.toString() == str.toString();
  }

  public compare(data: VmData): boolean {
    let str = data.unpack();
    return this.toString() < str.toString();
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value.join('');
  }     

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private append(vmStr: VmData) : VmObject {
    let str = vmStr.unpack().toString();
    for(let i = 0; i < str.length; i++) { this.value.push(str[i]); }
    return null; // Returned in R0
  }

  private charAt(vmIdx: VmInt): VmInt {
    let idx = vmIdx.unpack();
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    return new VmInt(this.value[idx].charCodeAt(0));
  }

  private copyChars(vmIdx: VmInt, vmStr: VmData): VmObject {
    let idx = vmIdx.unpack()
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    let str = vmStr.unpack();
    for(let i = 0; i < str.length; i++) {
      this.value[i + idx] = str[i];
    }
    return null; // Returned in R0
  }

  private deleteChars(vmIdx: VmInt, vmLen?: VmInt): VmObject {
    let idx = vmIdx.unpack();
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    let len = vmLen ? vmLen.unpack() : null;
    if(!len) {
      this.value.length = idx;
    } else {
      this.value.splice(idx, len);
    }
    return null; // Returned in R0
  }

  private insert(vmStr: VmData, vmIdx: VmInt): VmObject {
    let str = vmStr.unpack().toString();
    let idx = vmIdx.unpack();
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    // If index is past end of string, place it at end of string.
    if(idx > this.value.length) idx = this.value.length;
    this.value.splice(idx, 0, ...str.split(''));
    return null; // Returned in R0
  }

  private length(): VmInt {
    return new VmInt(this.value.length);
  }

  private splice(vmIdx: VmInt, vmLen: VmInt, vmStr: VmData): VmObject {
    let idx = vmIdx.unpack();
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    let len = vmLen.unpack();
    if(len < 0) len = 0;
    let str = vmStr.unpack().toString();
    this.value.splice(idx, len, ...str.split(''));
    return null; // Returned in R0
  }

  private substr(vmIdx: VmInt, vmLen?: VmInt): VmObject {
    let idx = vmIdx.unpack();
    idx = idx < 0 ? this.value.length + idx : idx - 1;
    let len = vmLen ? vmLen.unpack() : null; 
    if(!len || len <= 0) len = this.value.length - idx;
    let end = idx + len;
    return new VmObject(new MetaString(this.value.slice(idx, end).join('')));
  }
}

MetaclassRegistry.register('stringbuffer/030000', StringBuffer);

export { StringBuffer }