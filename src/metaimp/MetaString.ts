const MD5 = require("crypto-js/md5");
const SHA256 = require("crypto-js/sha256");

import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNil, VmTrue, VmFuncPtr, VmNativeCode, VmSstring } from "../types";
import { ByteArray } from "./ByteArray";
import { RexPattern } from "./RexPattern";
import { List } from "./List";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmType } from '../types/VmType';
import { builtin_rexSearch } from '../builtin/gen/rexSearch';
import { Match } from '../regexp/RegExpPlus';
import { AnonFunc } from './AnonFunc';

class MetaString extends RootObject {
  private value: string;

  constructor(val: string) {
    super();
    this.value = val;
  }

  getType() {
    return VmType.SSTRING;
  }

  unpack(): string {
    return this.value;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0:  return new VmNativeCode("String.length", this.length, 0);
      case 1:  return new VmNativeCode("String.substr", this.substr, 1, 1);
      case 2:  return new VmNativeCode("String.toUpper", this.toUpper, 0);
      case 3:  return new VmNativeCode("String.toLower", this.toLower, 0);
      case 4:  return new VmNativeCode("String.find", this.find, 1, 1);
      case 5:  return new VmNativeCode("String.toUnicode", this.toUnicode, 0, 1);
      case 6:  return new VmNativeCode("String.htmlify", this.htmlify, 0, 1);
      case 7:  return new VmNativeCode("String.startsWith", this.startsWith, 1);
      case 8:  return new VmNativeCode("String.endWith", this.endsWith, 1);
      case 9:  return new VmNativeCode("String.mapToByteArray", this.mapToByteArray, 0, 1);
      case 10: return new VmNativeCode("String.findReplace", this.findReplace, 2, 3);
      case 11: return new VmNativeCode("String.splice", this.splice, 2, 1);
      case 12: return new VmNativeCode("String.split", this.split, 0, 2);
      // case 13: return VmNativeCode("String.specialsToHTML", this.specialsToHTML, 0, 1);
      // case 14: return VmNativeCode("String.specialsToText", this.specialsToText, 0, 1);
      case 15: return new VmNativeCode("String.urlEncode", this.urlEncode, 0);
      case 16: return new VmNativeCode("String.urlDeoce", this.urlDecode, 0);
      case 17: return new VmNativeCode("String.sha256", this.sha256, 0);
      case 18: return new VmNativeCode("String.digestMD5", this.digestMD5, 0);
      // case 19: return new VmNativeCode(this.packBytes, 1, 0, true);
      // case 20: return new VmNativeCode(this.unpackBytes, 1);
      case 21: return new VmNativeCode("String.toTitleCase", this.toTitleCase, 0);
      case 22: return new VmNativeCode("String.toFoldedCase", this.toFoldedCase, 0);
      case 23: return new VmNativeCode("String.compareTo", this.compareTo, 1);
      case 24: return new VmNativeCode("String.compareIgnoreCase", this.compareIgnoreCase, 1);
      // case 25: return new VmNativeCode(this.findLast, 1, 1);
      case 26: return new VmNativeCode("String.findAll", this.findAll, 1, 0);
      case 27: return new VmNativeCode("String.match", this.match, 1, 0);
    }
    return null;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    throw('MetaString: Cannot load from image');
  }  

  // Helper method
  private unwrapIndex(vmIndex: VmInt): number {
    let idx = vmIndex ? vmIndex.unpack() : undefined;
    if(idx == undefined) return undefined;
    idx = idx <= 0 ? this.value.length + idx : idx - 1;
    return idx;
  }   

  equals(data: VmData, depth?: number): boolean {
    let str = data.unpack();
    return this.value == str.toString();
  }

  add(data: VmData): VmObject {
    let str = data.unpack();
    return new VmObject(new MetaString(this.value + str.toString()));
  }

  compare(data: VmData): boolean {
    let str = data.unpack();
    return this.value < str.toString();
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value;
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private compareTo(vmStr: VmData) : VmInt {
    let str = vmStr.unpack();
    let res = 0;
    if(this.value < str) res = -1;
    if(this.value > str) res = 1;
    return new VmInt(res);
  }

  private compareIgnoreCase(vmStr: VmData) : VmInt {
    let str = vmStr.unpack().toUpperCase().toLowerCase();
    let me = this.value.toUpperCase().toLowerCase();
    let res = 0;
    if(me < str) res = -1;
    if(me > str) res = 1;
    return new VmInt(res);
  }

  private digestMD5(): VmObject {
    let hash = MD5(this.value).toString();
    return new VmObject(new MetaString(hash));
  }

  private endsWith(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return this.value.endsWith(str) ? new VmTrue() : new VmNil();
  }

  private find(vmTarget: VmData, vmIndex?: VmInt): VmInt | VmNil {
    let res = builtin_rexSearch(vmTarget, new VmObject(this.id), vmIndex);
    if(res instanceof VmNil) return res;
    return res.unpack()[0];
  }

  private findAll(vmTarget: VmData, vmFunc?: VmData): VmObject {
    let target = vmTarget.unpack();
    let matches: Match[] = [];

    // Perform search using a RexPattern:
    if(target instanceof RexPattern) {
      let pos = 0;
      let m: Match = target.getRegExp().exec(this.value, pos);
      while(m != null) {
        matches.push(m);
        pos = m.index + m.length;
        m = target.getRegExp().exec(this.value, pos);
      }
    } 
    // Perform search using a string:
    else if(typeof(target) == 'string') {
      let count = 0, pos = 0, idx = 0;
      while((idx = this.value.indexOf(target, pos)) != -1) {
        let m = new Match();
        m.value = target;
        m.length = target.length;
        m.index = idx;
        matches.push(m);
        count++; pos = idx + target.length;
      }
    }
    else {
      throw('findAll: unsupported argument');
    }

    // Create a result list:
    let results: VmData[] = matches.map((m) => {
      // Build function argument list
      let args = [
        new VmSstring(m.value),
        new VmInt(m.index + 1)
      ];
      for(let i = 1; i < m.groups.length; i++) args.push(new VmSstring(m.groups[i].value));
    
      if(vmFunc instanceof VmFuncPtr || (vmFunc instanceof VmObject && vmFunc.getInstance() instanceof AnonFunc)) {
        let funcinfo = vmFunc.funcinfo();
        args = args.slice(0, funcinfo.params); // remove arguments that function doesn't expect
        while(funcinfo.params > args.length) args.push(new VmNil()); // Add nil for missing arguments.
        return vmFunc.invoke(...args);
      }

      else return new VmSstring(m.value);
    });

    return new VmObject(new List(results));
  }

  private htmlify(flags?: VmInt): VmData {
    // Replace & with &amp;
    // Replace < with &lt;
    let str = this.value;
    str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;');

    if(flags && (flags.value & 0x1)) { // HtmlifyTranslateSpaces
      str = str.replace(/ +/g, (x) => ' ' + '&nbsp;'.repeat(x.length-1));
    }
    if(flags && (flags.value & 0x2)) { // HtmlifyTranslateNewlines
      str = str.replace(/\n/g, '<br>');
    }
    if(flags && (flags.value & 0x4)) { // HtmlifyTranslateTabs
      str = str.replace(/\t/g, '<tab>');
    }

    // Return new Metastring instance:
    return new VmObject(new MetaString(str));
  }

  private length(): VmData {
    return new VmInt(this.value.length);
  }

  private mapToByteArray(charset?: VmInt): VmData {
    let b = new ByteArray(this.value);
    return new VmObject(b);
  }

  private match(vmTarget: VmData, vmIndex?: VmInt): VmInt | VmNil {
    let index = this.unwrapIndex(vmIndex);

    let obj = null; if(vmTarget instanceof VmObject) obj = vmTarget.getInstance();

    // If a RexPattern is specified, use it:
    if(obj instanceof RexPattern) {
      let regexp = obj.getRegExp();
      // Remove start of string up to index before looking for match.
      let m: any; // this.value.substr(index).match(regexp);
      // If no match, or match not at start, return nil.
      if(m == null || m.index != 0) return new VmNil();
      // Return length of match.
      return new VmInt(m[0].length);
    }
    // A string is specified. Use it:
    else {
      let str = (obj instanceof MetaString) ? obj.getValue() : vmTarget.value;
      // Get position of match.
      let pos = this.value.indexOf(str, index);
      // If no match, or match not at start, return nil.
      if(pos - index != 0) return new VmNil();
      // Return length of match (always same as search string):
      return new VmInt(str.length);
    }
  }  
  
  private sha256(): VmObject {
    let hash = SHA256(this.value).toString();
    return new VmObject(new MetaString(hash));
  }

  private splice(vmindex: VmInt, vmdeleteLength: VmInt, vminsertString?: VmObject): VmObject {
    let index = this.unwrapIndex(vmindex);
    // Decode arguments:
    let deleteLength = vmdeleteLength.unpack();
    let insertString = vminsertString ? vminsertString.unpack() : '';

    // Get string before deletion point:
    let left = this.value.substr(0, index);
    // Get string after deleted substring:
    let right = this.value.substr(index + deleteLength);
    // Contatenate left and right, inserting new substring:
    let result = left + (insertString ?? '') + right;
    // Create new string instance and return:
    return new VmObject(new MetaString(result));
  }

  private split(vmDelim?: VmData, vmLimit?: VmInt): VmObject {
    // If no delimiter specified, use 1 (split into 1-character substrings)
    let delim = vmDelim ? vmDelim.unpack() : 1;
    
    // Limit is a VmInt. If no VmInt present, use 0 for no lmit.
    let limit: number = vmLimit ? vmLimit.unpack() : 0;

    // Decode delim object, if it is an object:
    let parts: string[] = [];
    let str = this.value;

    // If delimiter is an integer, split string in parts of equal length:
    if(typeof(delim) == 'number') {
      while((limit > 1 || limit == 0) && str.length >= delim) {
        parts.push(str.substr(0, delim));
        str = str.substr(delim);
        if(limit != 0) limit--;
      }
    }

    // If delimiter is a string:
    else if(typeof(delim) == 'string') {
      let idx;
      while((limit > 1 || limit == 0) && (idx = str.indexOf(delim)) != -1) {
        parts.push(str.substr(0, idx));
        str = str.substr(idx + delim.length);
        if(limit != 0) limit--;
      }
    }

    // If delimiter is a RexPattern:
    else if(delim instanceof RexPattern) {
      let m: Match;
      // Find up to limit-1 matches (unless limit is 0)
      while((limit > 1 || limit == 0) && (m = delim.getRegExp().exec(str, 0))) {
        // Add match to list
        parts.push(str.substr(0, m.index));
        // Remove match from string
        str = str.substr(m.index+m.length);
        if(limit != 0) limit--;
      }
    }

    else throw('String.split: Unsupported delimiter type');

    // Add remainder (if any) to list:
    if(str.length > 0) parts.push(str);

    // Convert strings in list to MetaStrings:
    let metaParts: VmObject[] = parts.map((x) => new VmObject(new MetaString(x)));

    return new VmObject(new List(metaParts));
  }

  private startsWith(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return this.value.startsWith(str) ? new VmTrue() : new VmNil();
  }

  private substr(vmStart: VmInt, vmLength?: VmInt): VmObject {
    let start = vmStart.unpack() - 1;
    let length = vmLength ? vmLength.unpack() : null;

    let out;
    // Negative start means an offset from the end of the string.
    // A start of -1 means the last character.
    if(start < 0) {
      start = this.value.length + start + 1;
    }
    // No length
    if(!length) {
      out = this.value.substring(start);
    }
    // A positive length means number of characters to keep
    // from start;
    else if(length >= 0) {
      out = this.value.substring(start, start+length);
    } 
    // A negative length means number of characters to discard
    // from end of string.
    else {
      out = this.value.substring(start, this.value.length + length);
    }

    return new VmObject(new MetaString(out));
  }

  private toFoldedCase(): VmObject {
    return new VmObject(new MetaString(this.value.toUpperCase().toLowerCase()));
  }

  private toLower(): VmObject {
    return new VmObject(new MetaString(this.value.toLowerCase()));
  }  

  private toTitleCase(): VmObject {
    return new VmObject(new MetaString(this.value.toUpperCase()));
    // TODO: This should convert ligatures.
  }

  private toUpper(): VmObject {
    return new VmObject(new MetaString(this.value.toUpperCase()));
  }

  private toUnicode(vmIdx?: VmInt): VmData {
    let idx = this.unwrapIndex(vmIdx);

    // Was an index provided? Then return a single character code.
    if(idx != undefined) {
      // Positive index is from start of string,
      // negative index is from end of string.
      return new VmInt(this.value.charCodeAt(idx));
    } 
    
    // No index provided. Return a list of character codes.
    else {
      let codes = [];
      for(let i = 0; i < this.value.length; i++) {
        codes.push(new VmInt(this.value.charCodeAt(i)));
      }
      return new VmObject(new List(codes));
    }
  }

  private urlDecode() {
    return new VmObject(new MetaString(decodeURIComponent(this.value)));
  }

  private urlEncode() {
    return new VmObject(new MetaString(encodeURIComponent(this.value)));
  }

  protected findReplace(vmOldStr: VmData, vmNewStr: VmData, vmFlags?: VmInt, vmIndex?: VmInt, vmLimit?: VmInt): VmData {
    // TODO: Actually do something; currently just copies old str.
    return new VmObject(new MetaString(this.value));
  }

  getValue() {
    return this.value;
  }  
}

MetaclassRegistry.register('string/030008', MetaString);

export { MetaString }