import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNativeCode, VmNil, VmSstring, VmTrue, VmEnum } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Vm } from '../Vm';
import { Symbols } from '../Symbols';
import { Platform } from '../Platform';
import { TadsObject } from './TadsObject';
import { ByteArray } from './ByteArray';
import { VmRuntimeError, VmErr } from '../VmErrors';

// File modes (getFileMode)
const FileModeText = 1, FileModeData = 2, FileModeRaw = 3;
// Access modes
const FileAccessRead = 1, FileAccessWrite = 2, FileAccessReadWriteKeep = 3, FileAccessReadWriteTrunc = 4;
// Value tags in data mode files (as the reference VM writes them)
const TAG_INT = 0x01, TAG_STRING = 0x03, TAG_TRUE = 0x08, TAG_ENUM = 0x20;

type FileExceptionName = 'File.FileNotFoundException' | 'File.FileCreationException' | 'File.FileOpenException'
  | 'File.FileClosedException' | 'File.FileModeException' | 'File.FileIOException';

/** Throw an instance of one of the File exception classes the program exports. */
function fileException(name: FileExceptionName): never {
  let cls = Symbols.get(name);
  if(cls instanceof VmObject) throw new VmObject(new TadsObject(cls));
  throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
}

/** The name of a string (or FileName) argument. */
function argString(v: VmData): string {
  let s = v.unpack();
  return typeof(s) == 'string' ? s : v.toStr();
}

function optString(v: VmData | undefined): string | null {
  return v === undefined || v instanceof VmNil ? null : argString(v);
}

/**
 * File: reading and writing files (through the platform's file system:
 * real files under Node, memory or browser storage in a web page), and
 * reading resources embedded in the image. The whole file is kept in
 * memory; every write is saved at once. Text and data modes; raw mode
 * with readBytes/writeBytes.
 */
class File extends RootObject {
  private data: Uint8Array = null;    // the file's contents (null when closed)
  private length = 0;                 // (data may be longer than the file)
  private pos = 0;
  private mode = FileModeText;
  private charset = 'utf-8';
  private name: string = null;        // the file name (null for a resource)
  private writable = false;
  private readable = true;

  constructor(...args: any[]) {
    super();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    throw('File: Cannot load from image');
  }

  unpack(): any {
    return null;
  }

  getValue(): any {
    return null;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("File.openTextFile", this.openTextFile, 2, 1);
      case 1: return new VmNativeCode("File.openDataFile", this.openDataFile, 2);
      case 2: return new VmNativeCode("File.openRawFile", this.openRawFile, 2);
      case 3: return new VmNativeCode("File.getCharacterSet", this.getCharacterSet, 0);
      case 4: return new VmNativeCode("File.setCharacterSet", this.setCharacterSet, 1);
      case 5: return new VmNativeCode("File.closeFile", this.closeFile, 0);
      case 6: return new VmNativeCode("File.readFile", this.readFile, 0);
      case 7: return new VmNativeCode("File.writeFile", this.writeFile, 1);
      case 8: return new VmNativeCode("File.readBytes", this.readBytes, 1, 2);
      case 9: return new VmNativeCode("File.writeBytes", this.writeBytes, 1, 2);
      case 10: return new VmNativeCode("File.getPos", this.getPos, 0);
      case 11: return new VmNativeCode("File.setPos", this.setPos, 1);
      case 12: return new VmNativeCode("File.setPosEnd", this.setPosEnd, 0);
      case 13: return new VmNativeCode("File.openTextResource", this.openTextResource, 1, 1);
      case 14: return new VmNativeCode("File.openRawResource", this.openRawResource, 1);
      case 15: return new VmNativeCode("File.getFileSize", this.getFileSize, 0);
      case 16: return new VmNativeCode("File.getFileMode", this.getFileMode, 0);
      case 17: return new VmNativeCode("File.getRootName", this.getRootName, 1);
      case 19: return new VmNativeCode("File.setFileMode", this.setFileMode, 1, 1);
    }
    return null;
  }

  // Opening files

  /** A File object for a file, opened with an access mode. */
  private static openFile(vmName: VmData, vmAccess: VmData, mode: number, charset: string): VmData {
    let name = argString(vmName);
    let access = vmAccess instanceof VmInt ? vmAccess.value : 0;
    if(access < FileAccessRead || access > FileAccessReadWriteTrunc) fileException('File.FileOpenException');
    let fs = Platform.get().fs;
    let f = new File();
    f.name = name;
    f.mode = mode;
    f.charset = charset;
    f.readable = access != FileAccessWrite;
    f.writable = access != FileAccessRead;
    let existing: Uint8Array = null;
    try {
      existing = fs.readFile(name);
    } catch(e) {
      fileException('File.FileOpenException');
    }
    if(access == FileAccessRead) {
      if(existing === null) fileException('File.FileNotFoundException');
      f.data = existing;
    } else if(access == FileAccessReadWriteKeep && existing !== null) {
      f.data = existing.slice();
    } else {
      f.data = new Uint8Array(0);
      try {
        fs.writeFile(name, f.data);
      } catch(e) {
        fileException('File.FileCreationException');
      }
    }
    f.length = f.data.length;
    return new VmObject(f);
  }

  protected openTextFile(vmName: VmData, vmAccess: VmData, vmCharSet?: VmData): VmData {
    return File.openFile(vmName, vmAccess, FileModeText, optString(vmCharSet) ?? 'utf-8');
  }

  protected openDataFile(vmName: VmData, vmAccess: VmData): VmData {
    return File.openFile(vmName, vmAccess, FileModeData, 'utf-8');
  }

  protected openRawFile(vmName: VmData, vmAccess: VmData): VmData {
    return File.openFile(vmName, vmAccess, FileModeRaw, null);
  }

  /** A File object for a resource embedded in the image (read only). */
  private static openResource(name: string, mode: number, charset: string): VmData {
    let data = Vm.getInstance().resource(name);
    if(data === null) fileException('File.FileNotFoundException');
    let f = new File();
    f.data = data;
    f.length = data.length;
    f.mode = mode;
    f.charset = charset;
    return new VmObject(f);
  }

  protected openTextResource(vmName: VmData, vmCharSet?: VmData): VmData {
    return File.openResource(argString(vmName), FileModeText, optString(vmCharSet) ?? 'us-ascii');
  }

  protected openRawResource(vmName: VmData): VmData {
    return File.openResource(argString(vmName), FileModeRaw, null);
  }

  /** getRootName(filename): the name without its directory path. */
  protected getRootName(vmName: VmData): VmData {
    return new VmSstring(argString(vmName).replace(/^.*[\\/:]/, ''));
  }

  // State

  private checkOpen() {
    if(this.data === null) fileException('File.FileClosedException');
  }

  private checkRead() {
    this.checkOpen();
    if(!this.readable) fileException('File.FileModeException');
  }

  private checkWrite() {
    this.checkOpen();
    if(!this.writable) fileException('File.FileModeException');
  }

  protected getCharacterSet(): VmData {
    return this.mode == FileModeText ? new VmSstring(this.charset) : new VmNil();
  }

  protected setCharacterSet(vmCharSet: VmData): VmData {
    this.charset = argString(vmCharSet);
    return new VmNil();
  }

  protected setFileMode(vmMode: VmData, vmCharSet?: VmData): VmData {
    this.checkOpen();
    this.mode = vmMode.unpack();
    let cs = optString(vmCharSet);
    if(cs !== null) this.charset = cs;
    return new VmNil();
  }

  protected closeFile(): VmData {
    this.checkOpen();
    this.data = null;
    return new VmNil();
  }

  protected getPos(): VmData {
    this.checkOpen();
    return new VmInt(this.pos);
  }

  protected setPos(vmPos: VmData): VmData {
    this.checkOpen();
    this.pos = Math.max(0, Math.min(vmPos.unpack(), this.length));
    return new VmNil();
  }

  protected setPosEnd(): VmData {
    this.checkOpen();
    this.pos = this.length;
    return new VmNil();
  }

  protected getFileSize(): VmData {
    this.checkOpen();
    return new VmInt(this.length);
  }

  protected getFileMode(): VmData {
    this.checkOpen();
    return new VmInt(this.mode);
  }

  // Bytes

  private isUtf8(): boolean {
    return this.charset.toLowerCase().replace(/[-_ ]/g, '') == 'utf8';
  }

  /** Decode bytes with the file's character set. */
  private decode(bytes: Uint8Array): string {
    let cs = this.charset.toLowerCase().replace(/[-_ ]/g, '');
    if(cs == 'utf8') return new TextDecoder('utf-8').decode(bytes);
    if(cs == 'usascii' || cs == 'ascii') return String.fromCharCode(...Array.from(bytes).map((b) => b < 128 ? b : 63));
    return new TextDecoder('windows-1252').decode(bytes);
  }

  /** Encode text with the file's character set. */
  private encode(text: string): Uint8Array {
    if(this.isUtf8()) return new TextEncoder().encode(text);
    let ascii = /^(us)?ascii$/.test(this.charset.toLowerCase().replace(/[-_ ]/g, ''));
    return Uint8Array.from(Array.from(text).map((c) => {
      let n = c.codePointAt(0);
      return n < (ascii ? 128 : 256) ? n : 63;
    }));
  }

  /** Write bytes at the current position, and save the file. */
  private put(bytes: Uint8Array) {
    let end = this.pos + bytes.length;
    if(end > this.data.length) {
      let bigger = new Uint8Array(Math.max(end, this.data.length * 2, 256));
      bigger.set(this.data.subarray(0, this.length));
      this.data = bigger;
    }
    this.data.set(bytes, this.pos);
    this.pos = end;
    this.length = Math.max(this.length, end);
    try {
      Platform.get().fs.writeFile(this.name, this.data.slice(0, this.length));
    } catch(e) {
      fileException('File.FileIOException');
    }
  }

  /** Take n bytes at the current position (null if there aren't that many). */
  private take(n: number): Uint8Array | null {
    if(this.pos + n > this.length) return null;
    let bytes = this.data.subarray(this.pos, this.pos + n);
    this.pos += n;
    return bytes;
  }

  // Reading and writing values

  /**
   * readFile(): in text mode, the next line (ending in '\n', except
   * perhaps the last); in data mode, the next value; nil at the end.
   */
  protected readFile(): VmData {
    this.checkRead();
    if(this.mode == FileModeText) return this.readLine();
    if(this.mode == FileModeData) return this.readValue();
    fileException('File.FileModeException');
  }

  private readLine(): VmData {
    let d = this.data;
    if(this.pos >= this.length) return new VmNil();
    let start = this.pos, end = start;
    while(end < this.length && d[end] != 10 && d[end] != 13) end++;
    let text = this.decode(d.subarray(start, end));
    if(end < this.length) {
      // CR, LF, CR/LF or LF/CR all end the line.
      let c = d[end++];
      if(end < this.length && (d[end] == 10 || d[end] == 13) && d[end] != c) end++;
      text += '\n';
    }
    this.pos = end;
    return new VmSstring(text);
  }

  private readValue(): VmData {
    let tag = this.take(1);
    if(tag === null) return new VmNil();
    let int4 = (b: Uint8Array) => b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
    switch(tag[0]) {
      case TAG_INT: {
        let b = this.take(4);
        if(b === null) break;
        return new VmInt(int4(b));
      }
      case TAG_ENUM: {
        let b = this.take(4);
        if(b === null) break;
        return new VmEnum(int4(b) >>> 0);
      }
      case TAG_STRING: {
        let b = this.take(2);
        if(b === null) break;
        let s = this.take((b[0] | (b[1] << 8)) - 2);
        if(s === null) break;
        return new VmSstring(new TextDecoder('utf-8').decode(s));
      }
      case TAG_TRUE:
        return new VmTrue();
    }
    fileException('File.FileIOException');
  }

  /** writeFile(val): in text mode, write a string; in data mode, a value. */
  protected writeFile(val: VmData): VmData {
    this.checkWrite();
    if(this.mode == FileModeText) {
      this.put(this.encode(val.toStr()));
    } else if(this.mode == FileModeData) {
      this.put(this.encodeValue(val));
    } else {
      fileException('File.FileModeException');
    }
    return new VmNil();
  }

  private encodeValue(val: VmData): Uint8Array {
    let int4 = (tag: number, n: number) => Uint8Array.from([tag, n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >>> 24) & 0xFF]);
    if(val instanceof VmInt) return int4(TAG_INT, val.value);
    if(val instanceof VmEnum) return int4(TAG_ENUM, val.value);
    if(val instanceof VmTrue) return Uint8Array.from([TAG_TRUE]);
    if(val instanceof VmSstring || val instanceof VmObject) {
      // (Objects other than strings are written as their string value.)
      let bytes = new TextEncoder().encode(val.toStr());
      let n = bytes.length + 2;
      let out = new Uint8Array(3 + bytes.length);
      out.set([TAG_STRING, n & 0xFF, (n >> 8) & 0xFF]);
      out.set(bytes, 3);
      return out;
    }
    throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
  }

  // Bytes (raw mode)

  /** readBytes(byteArr, start?, cnt?): read bytes into a ByteArray; returns the number read. */
  protected readBytes(vmArr: VmData, vmStart?: VmData, vmCnt?: VmData): VmData {
    this.checkRead();
    if(this.mode == FileModeText) fileException('File.FileModeException');
    let ba = vmArr instanceof VmObject ? vmArr.getInstance() : null;
    if(!(ba instanceof ByteArray)) throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
    let bytes = ba.getBytes();
    let start = vmStart && !(vmStart instanceof VmNil) ? vmStart.unpack() - 1 : 0;
    let cnt = vmCnt && !(vmCnt instanceof VmNil) ? vmCnt.unpack() : bytes.length - start;
    cnt = Math.max(0, Math.min(cnt, bytes.length - start, this.length - this.pos));
    (ba as any).beforeChange();
    for(let i = 0; i < cnt; i++) bytes[start + i] = this.data[this.pos + i];
    this.pos += cnt;
    return new VmInt(cnt);
  }

  /** writeBytes(source, start?, cnt?): write bytes from a ByteArray (or another File). */
  protected writeBytes(vmSrc: VmData, vmStart?: VmData, vmCnt?: VmData): VmData {
    this.checkWrite();
    if(this.mode == FileModeText) fileException('File.FileModeException');
    let src = vmSrc instanceof VmObject ? vmSrc.getInstance() : null;
    let bytes: ArrayLike<number>;
    if(src instanceof ByteArray) bytes = src.getBytes();
    else if(src instanceof File) { src.checkRead(); bytes = src.data.subarray(src.pos, src.length); }
    else throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
    let start = vmStart && !(vmStart instanceof VmNil) ? vmStart.unpack() - (src instanceof ByteArray ? 1 : 0) : 0;
    let cnt = vmCnt && !(vmCnt instanceof VmNil) ? vmCnt.unpack() : bytes.length - start;
    cnt = Math.max(0, Math.min(cnt, bytes.length - start));
    this.put(Uint8Array.from(Array.prototype.slice.call(bytes, start, start + cnt)));
    if(src instanceof File) src.pos += start + cnt;
    return new VmNil();
  }
}

MetaclassRegistry.register('file/030003', File);

export { File }
