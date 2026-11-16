import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmObject, VmNativeCode, VmSstring } from "../types";
import { MetaString } from "./MetaString";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmRuntimeError, VmErr } from '../VmErrors';

/**
 * StringBuffer: a mutable string. Methods that edit the buffer return the
 * buffer itself. Behaviour follows the reference VM where it differs from
 * the manual (e.g. insert(idx, str) and copyChars(idx, str) take the
 * index first).
 */
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
      case 7: return new VmNativeCode("StringBuffer.substr", this.substr, 1, 1);
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
   * Helpers
   */

  /** Convert an argument to text: strings as is, nil to nothing, others via toString. */
  private static text(vm: VmData): string[] {
    if(vm instanceof VmNil) return [];
    return Array.from(vm.toStr());
  }

  /** Convert a 1-based index (negative counts from the end) to 0-based. */
  private index(vmIdx: VmData): number {
    if(!(vmIdx instanceof VmInt)) throw new VmRuntimeError(VmErr.INT_VAL_REQD);
    let idx = vmIdx.unpack();
    return idx < 0 ? this.value.length + idx : idx - 1;
  }

  /** As index(), but the index must refer to an existing character. */
  private existingIndex(vmIdx: VmData): number {
    let idx = this.index(vmIdx);
    if(idx < 0 || idx >= this.value.length) throw new VmRuntimeError(VmErr.INDEX_OUT_OF_RANGE);
    return idx;
  }

  private self(): VmData {
    return new VmObject(this.id);
  }

  /*
   * Virtual methods implementation
   */

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

  /**
   * b[idx]: the character at idx, as a one-character string. (The
   * reference VM doesn't allow negative indices here.)
   */
  public getindex(vmIdx: VmData): VmData {
    if(!(vmIdx instanceof VmInt)) throw new VmRuntimeError(VmErr.INT_VAL_REQD);
    let idx = vmIdx.unpack();
    if(idx < 1 || idx > this.value.length) throw new VmRuntimeError(VmErr.INDEX_OUT_OF_RANGE);
    return new VmSstring(this.value[idx - 1]);
  }

  /**
   * b[idx] = val: replace the character at idx (negative counts from the
   * end) with the first character of a string, or a character code.
   */
  public setindex(vmIdx: VmData, data: VmData): VmData {
    this.beforeChange();
    let idx = this.existingIndex(vmIdx);
    let c = (data instanceof VmInt) ? String.fromCodePoint(data.unpack()) : StringBuffer.text(data)[0];
    if(c !== undefined) this.value[idx] = c;
    return this.self();
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * Append text (converting non-strings; nil adds nothing).
   * @returns self
   */
  private append(vmStr: VmData): VmData {
    this.beforeChange();
    this.value.push(...StringBuffer.text(vmStr));
    return this.self();
  }

  /**
   * Character code at idx (negative counts from the end).
   */
  private charAt(vmIdx: VmInt): VmInt {
    return new VmInt(this.value[this.existingIndex(vmIdx)].codePointAt(0));
  }

  /**
   * Overwrite characters from idx with str, extending the buffer as needed.
   * @returns self
   */
  private copyChars(vmIdx: VmInt, vmStr: VmData): VmData {
    this.beforeChange();
    let idx = Math.max(0, this.index(vmIdx));
    let chars = StringBuffer.text(vmStr);
    if(idx > this.value.length) idx = this.value.length;
    for(let i = 0; i < chars.length; i++) this.value[idx + i] = chars[i];
    return this.self();
  }

  /**
   * Delete len characters from idx, or all characters from idx.
   * @returns self
   */
  private deleteChars(vmIdx: VmInt, vmLen?: VmInt): VmData {
    this.beforeChange();
    let idx = Math.max(0, this.index(vmIdx));
    let len = (vmLen instanceof VmInt) ? Math.max(0, vmLen.unpack()) : this.value.length;
    this.value.splice(idx, len);
    return this.self();
  }

  /**
   * Insert text before the character at idx (past the end: append).
   * @returns self
   */
  private insert(vmIdx: VmInt, vmStr: VmData): VmData {
    this.beforeChange();
    let idx = Math.max(0, Math.min(this.index(vmIdx), this.value.length));
    this.value.splice(idx, 0, ...StringBuffer.text(vmStr));
    return this.self();
  }

  private length(): VmInt {
    return new VmInt(this.value.length);
  }

  /**
   * Replace len characters at idx with str.
   * @returns self
   */
  private splice(vmIdx: VmInt, vmLen: VmInt, vmStr: VmData): VmData {
    this.beforeChange();
    let idx = Math.max(0, Math.min(this.index(vmIdx), this.value.length));
    let len = Math.max(0, vmLen.unpack());
    this.value.splice(idx, len, ...StringBuffer.text(vmStr));
    return this.self();
  }

  /**
   * The text of len characters from idx, or to the end; a length of 0 or
   * less gives an empty string.
   */
  private substr(vmIdx: VmInt, vmLen?: VmInt): VmData {
    let idx = Math.max(0, this.index(vmIdx));
    let end = (vmLen instanceof VmInt) ? idx + Math.max(0, vmLen.unpack()) : this.value.length;
    return new VmSstring(this.value.slice(idx, end).join(''));
  }
}

MetaclassRegistry.register('stringbuffer/030000', StringBuffer);

export { StringBuffer }
