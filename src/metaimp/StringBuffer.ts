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
      case 0: return new VmNativeCode("StringBuffer.length", this.length, 0);
      case 1: return new VmNativeCode("StringBuffer.charAt", this.charAt, 1);
      case 2: return new VmNativeCode("StringBuffer.append", this.append, 1);
      case 3: return new VmNativeCode("StringBuffer.insert", this.insert, 2);
      case 4: return new VmNativeCode("StringBuffer.copyChars", this.copyChars, 2);
      case 5: return new VmNativeCode("StringBuffer.deleteChars", this.deleteChars, 1, 1);
      case 6: return new VmNativeCode("StringBuffer.splice", this.splice, 3);
      case 7: return new VmNativeCode("StringBuffer.substr", this.substr, 1, 0);
    }
    return null;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let strbuf = new StringBuffer();
    offset += 4; // Skip buffer_length
    offset += 4; // Skip buffer_increment
    // Read length of string
    let string_length = image.getUInt32(offset); offset += 4;
    // String is encoded in 2-byte UTF-16 codes:
    for(let i = 0; i < string_length; i++) {
      let code = image.getUInt16(offset); offset += 2;
      // Add UTF-16 characters to string buffre:
      strbuf.value.push(String.fromCharCode(code));
    }
    return strbuf;
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

  public equals(data: VmData, depth?: number): boolean {
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