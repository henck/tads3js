import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmObject, VmNativeCode, VmList, VmSstring } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from './MetaString';
import { VmRuntimeError, VmErr } from '../VmErrors';
import { BytePacker } from '../util/BytePacker';

const CryptoJS = { MD5: require('crypto-js/md5'), SHA256: require('crypto-js/sha256'), WordArray: require('crypto-js/lib-typedarrays') };

/** Hex digest (upper case) of bytes. */
export function digest(algorithm: string, bytes: number[]): string {
  let words = CryptoJS.WordArray.create(new Uint8Array(bytes));
  let hash = algorithm == 'md5' ? CryptoJS.MD5(words) : CryptoJS.SHA256(words);
  return hash.toString().toUpperCase();
}

/**
 * Encode text with a character set. Only a few common character sets are
 * supported for now (the CharacterSet class isn't implemented).
 */
export function encodeCharset(text: string, charset: string): number[] {
  switch(normalizeCharset(charset)) {
    case 'utf8': return Array.from(new TextEncoder().encode(text));
    case 'ascii': return Array.from(text).map((c) => c.charCodeAt(0) < 128 ? c.charCodeAt(0) : 63);
    default: return Array.from(text).map((c) => c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63);
  }
}

export function decodeCharset(bytes: number[], charset: string): string {
  switch(normalizeCharset(charset)) {
    case 'utf8': return new TextDecoder().decode(new Uint8Array(bytes));
    default: return String.fromCharCode(...bytes);
  }
}

function normalizeCharset(name: string): string {
  let n = (name ?? '').toLowerCase().replace(/[-_ ]/g, '');
  if(n == 'utf8') return 'utf8';
  if(n == 'usascii' || n == 'ascii') return 'ascii';
  if(n == 'latin1' || n == 'iso88591' || n == '') return 'latin1';
  throw new Error(`Character set '${name}' is not supported yet`);
}

/** The name of a character set argument (a string), or null for nil/none. */
function charsetName(v: VmData): string {
  if(v === undefined || v instanceof VmNil) return null;
  let s = v.unpack();
  return typeof(s) == 'string' ? s : v.toStr();
}

/**
 * ByteArray: a fixed-size array of bytes (0 to 255), with reference
 * semantics.
 */
class ByteArray extends RootObject {
  private value: number[];
  public readonly isByteArray = true;

  /**
   * new ByteArray(size), new ByteArray(string, charset?), or
   * new ByteArray(byteArray, startIndex?, length?)
   */
  constructor(...args: VmData[]) {
    super();
    this.value = [];
    if(args.length == 0) return;
    let a = args[0];
    if(a instanceof VmInt) {
      this.value = new Array(Math.max(0, a.unpack())).fill(0);
      return;
    }
    let v = a.unpack();
    if(typeof(v) == 'string') {
      let cs = charsetName(args[1]);
      if(cs !== null) { this.value = encodeCharset(v, cs); return; }
      this.value = Array.from(v).map((c) => {
        let cp = c.codePointAt(0);
        if(cp > 255) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
        return cp;
      });
      return;
    }
    if(a instanceof VmObject && a.getInstance() instanceof ByteArray) {
      let src = (a.getInstance() as ByteArray).value;
      let start = args[1] instanceof VmInt ? args[1].unpack() - 1 : 0;
      let len = args[2] instanceof VmInt ? args[2].unpack() : src.length - start;
      this.value = src.slice(start, start + len);
      return;
    }
    throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
  }

  /** Create a ByteArray holding the given bytes. */
  static of(bytes: number[]): ByteArray {
    let b = new ByteArray();
    b.value = bytes;
    return b;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    // UINT4 element count, then the bytes.
    let len = image.getUInt32(offset);
    let bytes: number[] = [];
    for(let i = 0; i < len; i++) bytes.push(image.getUInt8(offset + 4 + i));
    return ByteArray.of(bytes);
  }

  unpack(): any {
    return this;
  }

  getValue(): any {
    return this.value;
  }

  public getBytes(): number[] {
    return this.value;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return  new VmNativeCode("ByteArray.length", this.length, 0);
      case 1: return  new VmNativeCode("ByteArray.subarray", this.subarray, 1, 1);
      case 2: return  new VmNativeCode("ByteArray.copyFrom", this.copyFrom, 4);
      case 3: return  new VmNativeCode("ByteArray.fillValue", this.fillValue, 1, 2);
      case 4: return  new VmNativeCode("ByteArray.mapToString", this.mapToString, 0, 3);
      case 5: return  new VmNativeCode("ByteArray.readInt", this.readInt, 2);
      case 6: return  new VmNativeCode("ByteArray.writeInt", this.writeInt, 3);
      case 7: return  new VmNativeCode("ByteArray.packBytes", this.packBytes, 1, 0, true);
      case 8: return  new VmNativeCode("ByteArray.unpackBytes", this.unpackBytes, 2);
      case 9: return  new VmNativeCode("ByteArray.sha256", this.sha256, 0, 2);
      case 10: return new VmNativeCode("ByteArray.digestMD5", this.digestMD5, 0, 2);
    }
    return null;
  }

  /*
   * Helpers
   */

  private self(): VmData {
    return new VmObject(this.id);
  }

  /** A 1-based index argument as a 0-based index into the array. */
  private index(v: VmData): number {
    if(!(v instanceof VmInt)) throw new VmRuntimeError(VmErr.INT_VAL_REQD);
    return v.unpack() - 1;
  }

  /** Check that [start, start+len) lies within the array. */
  private checkRange(start: number, len: number) {
    if(start < 0 || len < 0 || start + len > this.value.length) throw new VmRuntimeError(VmErr.INDEX_OUT_OF_RANGE);
  }

  /** Optional start/length arguments as a range within the array. */
  private range(vmStart?: VmData, vmLen?: VmData): [number, number] {
    let start = vmStart instanceof VmInt ? vmStart.unpack() - 1 : 0;
    let len = vmLen instanceof VmInt ? vmLen.unpack() : this.value.length - start;
    this.checkRange(start, len);
    return [start, len];
  }

  private static byteValue(v: VmData): number {
    if(!(v instanceof VmInt)) throw new VmRuntimeError(VmErr.INT_VAL_REQD);
    let b = v.unpack();
    if(b < 0 || b > 255) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return b;
  }

  private static packer = new BytePacker({
    bytes: () => [],
    make: (bytes: number[]) => new VmObject(ByteArray.of(bytes)),
  });

  /*
   * Virtual methods implementation
   */

  public getindex(vmIndex: VmData): VmData {
    let idx = this.index(vmIndex);
    this.checkRange(idx, 1);
    return new VmInt(this.value[idx]);
  }

  public setindex(vmIndex: VmData, data: VmData): VmData {
    this.beforeChange();
    let idx = this.index(vmIndex);
    this.checkRange(idx, 1);
    this.value[idx] = ByteArray.byteValue(data);
    return this.self();
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return String.fromCharCode(...this.value);
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * Copy bytes from another (or the same) ByteArray; overlapping ranges
   * are handled correctly.
   * @returns self
   */
  private copyFrom(vmSource: VmData, vmSourceIndex: VmInt, vmDestIndex: VmInt, vmLen: VmInt): VmData {
    this.beforeChange();
    let src = vmSource instanceof VmObject ? vmSource.getInstance() : null;
    if(!(src instanceof ByteArray)) throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
    let sourceIndex = this.index(vmSourceIndex);
    let destIndex = this.index(vmDestIndex);
    let len = vmLen.unpack();
    src.checkRange(sourceIndex, len);
    this.checkRange(destIndex, len);
    let bytes = src.value.slice(sourceIndex, sourceIndex + len);
    for(let i = 0; i < len; i++) this.value[destIndex + i] = bytes[i];
    return this.self();
  }

  /** MD5 digest of the bytes (or a range), as 32 hex digits. */
  private digestMD5(vmStart?: VmInt, vmLen?: VmInt): VmData {
    let [start, len] = this.range(vmStart, vmLen);
    return new VmSstring(digest('md5', this.value.slice(start, start + len)));
  }

  /**
   * Store a value in each byte from startIndex for length bytes (default:
   * the whole array, or to the end).
   * @returns self
   */
  private fillValue(vmVal: VmData, vmStart?: VmData, vmLen?: VmData): VmData {
    this.beforeChange();
    let b = ByteArray.byteValue(vmVal);
    let [start, len] = this.range(vmStart, vmLen);
    for(let i = start; i < start + len; i++) this.value[i] = b;
    return this.self();
  }

  private length(): VmData {
    return new VmInt(this.value.length);
  }

  /**
   * Map bytes to a string, with a character set (nil: each byte is a
   * character code).
   */
  private mapToString(vmCharset?: VmData, vmStart?: VmInt, vmLen?: VmInt): VmData {
    let [start, len] = this.range(vmStart, vmLen);
    let bytes = this.value.slice(start, start + len);
    let cs = charsetName(vmCharset);
    return new VmSstring(cs === null ? String.fromCharCode(...bytes) : decodeCharset(bytes, cs));
  }

  /** readInt/writeInt format: size (0/1/2 = 8/16/32 bits), endianness, signedness. */
  private static intFormat(fmt: number): { size: number, bigEndian: boolean, signed: boolean } {
    return { size: [1, 2, 4][fmt & 0x000f] ?? 1, bigEndian: (fmt & 0x0010) != 0, signed: (fmt & 0x0100) == 0 };
  }

  /** Read an integer of the given format. */
  private readInt(vmStart: VmInt, vmFmt: VmInt): VmInt {
    let f = ByteArray.intFormat(vmFmt.unpack());
    let start = this.index(vmStart);
    this.checkRange(start, f.size);
    let bytes = this.value.slice(start, start + f.size);
    if(f.bigEndian) bytes.reverse();
    let v = 0;
    for(let i = f.size - 1; i >= 0; i--) v = v * 256 + bytes[i];
    if(f.signed && bytes[f.size - 1] >= 0x80) v -= Math.pow(2, 8 * f.size);
    return new VmInt(v | 0);
  }

  /** Write an integer in the given format, truncated to its size. */
  private writeInt(vmStart: VmInt, vmFmt: VmInt, vmVal: VmInt): VmData {
    this.beforeChange();
    let f = ByteArray.intFormat(vmFmt.unpack());
    let start = this.index(vmStart);
    this.checkRange(start, f.size);
    let v = vmVal.unpack();
    let bytes: number[] = [];
    for(let i = 0; i < f.size; i++) bytes.push((v >>> (8 * i)) & 0xff);
    if(f.bigEndian) bytes.reverse();
    for(let i = 0; i < f.size; i++) this.value[start + i] = bytes[i];
    return new VmNil();
  }

  /**
   * arr.packBytes(index, format, ...) packs into this array and returns
   * the number of bytes written; ByteArray.packBytes(format, ...) returns
   * a new ByteArray.
   */
  private packBytes(...args: VmData[]): VmData {
    this.beforeChange();
    // The static form is called on the class, with a format string first.
    if(!(args[0] instanceof VmInt)) {
      return new VmObject(ByteArray.of(ByteArray.packer.pack(args[0].unpack(), args.slice(1))));
    }
    let start = this.index(args[0]);
    let bytes = ByteArray.packer.pack(args[1].unpack(), args.slice(2));
    if(start < 0 || start + bytes.length > this.value.length) throw new VmRuntimeError(102);
    for(let i = 0; i < bytes.length; i++) this.value[start + i] = bytes[i];
    return new VmInt(bytes.length);
  }

  /** Unpack values starting at index; returns a list. */
  private unpackBytes(vmStart: VmInt, vmFormat: VmData): VmData {
    let start = this.index(vmStart);
    let r = ByteArray.packer.unpack(this.value, start, vmFormat.unpack());
    return new VmList(r.values);
  }

  /** SHA-256 hash of the bytes (or a range), as 64 hex digits. */
  private sha256(vmStart?: VmInt, vmLen?: VmInt): VmData {
    let [start, len] = this.range(vmStart, vmLen);
    return new VmSstring(digest('sha256', this.value.slice(start, start + len)));
  }

  /** A new ByteArray with the bytes from startIndex, for length bytes. */
  private subarray(vmStart: VmInt, vmLen?: VmInt): VmData {
    // A length past the end is clamped.
    let start = this.index(vmStart);
    let len = vmLen instanceof VmInt ? Math.min(vmLen.unpack(), this.value.length - start) : undefined;
    [start, len] = this.range(vmStart, len === undefined ? undefined : new VmInt(len));
    return new VmObject(ByteArray.of(this.value.slice(start, start + len)));
  }
}

MetaclassRegistry.register('bytearray/030002', ByteArray);

export { ByteArray }
