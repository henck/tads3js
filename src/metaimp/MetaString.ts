const MD5 = require("crypto-js/md5");
const SHA256 = require("crypto-js/sha256");

import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNil, VmTrue, VmFuncPtr, VmNativeCode, VmSstring, VmList } from "../types"
import { ByteArray } from "./ByteArray"
import { BytePacker } from "../util/BytePacker"
import { RexPattern } from "./RexPattern"
import { List } from "./List"
import { SourceImage } from "../SourceImage"
import { Pool } from "../Pool"
import { VmType } from '../types/VmType'
import { builtin_rexSearch } from '../builtin/gen/rexSearch'
import { builtin_rexMatch } from '../builtin/gen/rexMatch'
import { builtin_rexReplace } from '../builtin/gen/rexReplace'
import { Match } from '../regexp/TadsRegex'
import { AnonFunc } from './AnonFunc'
import { translateSpecials, ISpecialsState } from '../util/Specials'
import { Symbols } from '../Symbols'
import { Vm } from '../Vm'
import { VmProp } from '../types'
import { VmRuntimeError, VmErr } from '../VmErrors'

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
      case 8:  return new VmNativeCode("String.endsWith", this.endsWith, 1);
      case 9:  return new VmNativeCode("String.mapToByteArray", this.mapToByteArray, 0, 1);
      case 10: return new VmNativeCode("String.findReplace", this.findReplace, 2, 3);
      case 11: return new VmNativeCode("String.splice", this.splice, 2, 1);
      case 12: return new VmNativeCode("String.split", this.split, 0, 2);
      case 13: return new VmNativeCode("String.specialsToHtml", this.specialsToHtml, 0, 1);
      case 14: return new VmNativeCode("String.specialsToText", this.specialsToText, 0, 1);
      case 15: return new VmNativeCode("String.urlEncode", this.urlEncode, 0);
      case 16: return new VmNativeCode("String.urlDecode", this.urlDecode, 0);
      case 17: return new VmNativeCode("String.sha256", this.sha256, 0);
      case 18: return new VmNativeCode("String.digestMD5", this.digestMD5, 0);
      case 19: return new VmNativeCode("String.packBytes", this.packBytes, 1, 0, true);
      case 20: return new VmNativeCode("String.unpackBytes", this.unpackBytes, 1);
      case 21: return new VmNativeCode("String.toTitleCase", this.toTitleCase, 0);
      case 22: return new VmNativeCode("String.toFoldedCase", this.toFoldedCase, 0);
      case 23: return new VmNativeCode("String.compareTo", this.compareTo, 1);
      case 24: return new VmNativeCode("String.compareIgnoreCase", this.compareIgnoreCase, 1);
      case 25: return new VmNativeCode("String.findLast", this.findLast, 1, 1);
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

  add(data: VmData): VmData {
    // Adding nil adds nothing; anything else is converted to a string.
    return new VmSstring(this.value + (data instanceof VmNil ? '' : data.toStr()));
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

  /**
   * Compares this string to the second string str, returning an integer less than 0 
   * if this string sorts before str, 0 if the two strings are identical, or greater 
   * than 0 if this string sorts after str. 
   * @param vmStr String to compare to
   * @returns Comparison int
   */
  private compareTo(vmStr: VmData) : VmInt {
    let str = vmStr.unpack();
    let res = 0;
    if(this.value < str) res = -1;
    if(this.value > str) res = 1;
    return new VmInt(res);
  }

  /**
   * Compares this string to the second string str, ignoring differences in upper/lower case. 
   * For example, "A" and "a" are treated as equal. Returns an integer less than 0 if this 
   * string sorts before str, 0 if the two strings are identical, or greater than 0 if this 
   * string sorts after str. 
   * @param vmStr String to comapre to
   * @returns Comparison int
   */
  private compareIgnoreCase(vmStr: VmData) : VmInt {
    let str = vmStr.unpack().toUpperCase().toLowerCase();
    let me = this.value.toUpperCase().toLowerCase();
    let res = 0;
    if(me < str) res = -1;
    if(me > str) res = 1;
    return new VmInt(res);
  }

  /**
   * Calculates the 128-bit RSA MD5 message digest of the string, returning a string of 
   * 32 hex digits representing the digest value. 
   * @returns Digest string
   */
  private digestMD5(): VmData {
    let hash = MD5(this.value).toString().toUpperCase();
    return new VmSstring(hash);
  }

  /**
   * Returns true if this string ends with str, nil if not. 
   * @param vmStr String to test
   * @returns True if string ends with str, nil if not.
   */
  private endsWith(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return this.value.endsWith(str) ? new VmTrue() : new VmNil();
  }

  /**
   * Finds the substring or regular expression target within this string. 
   * @param vmTarget Substring or RexPattern to search for
   * @param vmIndex Start index of match, or nil if not found
   */
  private find(vmTarget: VmData, vmIndex?: VmInt): VmInt | VmNil {
    // If target is a regular string, turn it into an escape regexp
    // that matches only the literal string.
    let target = vmTarget.unpack();
    if(typeof(target) == 'string') vmTarget = new VmObject(RexPattern.escape(target));

    let res = builtin_rexSearch(vmTarget, new VmSstring(this.value), vmIndex);
    if(res instanceof VmNil) return res;
    return res.unpack()[0];
  }

  /**
   * Searches the subject string (self) for all occurrences of a given 
   * substring or regular expression pattern, returning a list of matches. 
   * @param vmTarget Substring or RexPattern to search for
   * @param vmFunc Function to apply to each match
   * @returns Match list
   */
  private findAll(vmTarget: VmData, vmFunc?: VmData): VmData {
    // If target is a regular string, convert it to an escaped RexPattern
    // so we can use regexp functions.    
    let target = vmTarget.unpack();
    if(typeof(target) == 'string') target = RexPattern.escape(target);
    if(!(target instanceof RexPattern)) throw('String.findAll: unsupported argument');
    
    let matches: Match[] = [];

    // Perform search:
    let pos = 0;
    let m: Match = target.getRegExp().exec(this.value, pos);
    while(m != null) {
      matches.push(m);
      pos = m.index + m.length;
      m = target.getRegExp().exec(this.value, pos);
    }

    // Create a result list:
    let results: VmData[] = matches.map((m) => {
      // Build function argument list
      let args = [
        new VmSstring(m.value),
        new VmInt(m.index + 1)
      ];
      for(let i = 1; i < m.groups.length; i++) {
        // A group that didn't take part in the match is nil.
        args.push(m.groups[i] ? new VmSstring(m.groups[i].value) : new VmNil());
      }
    
      if(vmFunc instanceof VmFuncPtr || (vmFunc instanceof VmObject && vmFunc.getInstance() instanceof AnonFunc)) {
        let funcinfo = vmFunc.funcinfo();
        args = args.slice(0, funcinfo.params); // remove arguments that function doesn't expect
        while(funcinfo.params > args.length) args.push(new VmNil()); // Add nil for missing arguments.
        return vmFunc.invoke(...args);
      }

      else return new VmSstring(m.value);
    });

    return new VmList(results);
  }

  /**
   * findReplace() without regular expressions, for the common case: plain
   * strings (or lists of them) to find and replace, all occurrences, from
   * the start. Returns null if this case doesn't apply. With lists, the
   * string is scanned once, and at each position the first listed string
   * that matches is replaced (as rexReplace does).
   */
  private static plainReplace(str: string, oldStr: any, newStr: any, vmFlags?: VmData, vmIndex?: VmData, vmLimit?: VmData): string | null {
    const ReplaceAll = 1;
    if(vmIndex !== undefined || vmLimit !== undefined) return null;
    if(vmFlags !== undefined && !(vmFlags instanceof VmInt && vmFlags.value == ReplaceAll)) return null;
    let olds: any[] = Array.isArray(oldStr) ? oldStr.map((x: VmData) => x.unpack()) : [oldStr];
    let news: any[] = Array.isArray(newStr) ? newStr.map((x: VmData) => x.unpack()) : null;
    if(olds.some((o) => typeof(o) != 'string' || o == '')) return null;
    if(news ? news.some((n) => typeof(n) != 'string') : typeof(newStr) != 'string') return null;
    // A single replacement string goes with every string to find; with a
    // list, missing replacements are empty.
    let repl = (i: number) => news ? (news[i] ?? '') : newStr;
    if(olds.length == 1) return str.split(olds[0]).join(repl(0));
    let out = '';
    let i = 0;
    while(i < str.length) {
      let k = olds.findIndex((o) => str.startsWith(o, i));
      if(k < 0) { out += str[i++]; continue; }
      out += repl(k);
      i += olds[k].length;
    }
    return out;
  }

  protected findReplace(vmOldStr: VmData, vmNewStr: VmData, vmFlags?: VmInt, vmIndex?: VmInt, vmLimit?: VmInt): VmData {
    // Argument may be simple string or a list containing simple strings.
    // These simple strings must be converted to RexPatterns before rexReplace
    // can be used.
    let oldStr = vmOldStr.unpack(); // string, RexPattern or array
    let fast = MetaString.plainReplace(this.value, oldStr, vmNewStr.unpack(), vmFlags, vmIndex, vmLimit);
    if(fast !== null) return new VmSstring(fast);
    if(typeof(oldStr) == 'string') vmOldStr = new VmObject(RexPattern.escape(oldStr));
    if(Array.isArray(oldStr)) {
      vmOldStr = new VmList(oldStr.map((vmX) => {
        let x = vmX.unpack();
        if(typeof(x) == 'string') vmX = new VmObject(RexPattern.escape(x));
        return vmX;
      }));
    }

    return builtin_rexReplace(vmOldStr, new VmObject(this), vmNewStr, vmFlags, vmIndex, vmLimit);
  }

  /**
   * Converts HTML markup-significant characters in the 
   * string to appropriate HTML sequences, and returns the resulting string. 
   * @param flags Flags
   * @returns Converted string
   */
  private htmlify(flags?: VmInt): VmData {
    let f = flags ? flags.value : 0;
    let spaces = (f & 0x1) != 0;   // HtmlifyTranslateSpaces
    let newlines = (f & 0x2) != 0; // HtmlifyTranslateNewlines
    let tabs = (f & 0x4) != 0;     // HtmlifyTranslateTabs

    let out = '';
    let prev = '';
    for(let c of this.value) {
      switch(c) {
        case '&': out += '&amp;'; break;
        case '<': out += '&lt;'; break;
        case '>': out += '&gt;'; break;
        case '\n': out += newlines ? '<br>' : c; break;
        case '\t': out += tabs ? '<tab>' : c; break;
        // A space following whitespace becomes &nbsp;, so that runs of
        // spaces (and indentation after a line break) survive rendering.
        case ' ': out += (spaces && (prev == ' ' || prev == '\n' || prev == '\t')) ? '&nbsp;' : c; break;
        default: out += c;
      }
      prev = c;
    }

    // Return new Metastring instance:
    return new VmSstring(out);
  }

  /**
   * Returns the number of characters in the string. 
   * @returns Number
   */
  private length(): VmData {
    return new VmInt(this.value.length);
  }

  /**
   * Creates a ByteArray object based on the contents of the string. 
   * @param charset CharacterSet to use
   * @returns ByteArray
   * @todo CharacterSet support
   */
  private mapToByteArray(vmCharset?: VmData): VmData {
    return new VmObject(new ByteArray(new VmSstring(this.value), ...(vmCharset ? [vmCharset] : [])));
  }

  private static packer = new BytePacker({
    bytes: () => [],
    make: (bytes: number[]) => new VmObject(ByteArray.of(bytes)),
  });

  /**
   * String.packBytes(format, ...): pack values into a string, one
   * character per byte.
   */
  private packBytes(vmFormat: VmData, ...args: VmData[]): VmData {
    let bytes = MetaString.packer.pack(vmFormat.unpack(), args);
    return new VmSstring(String.fromCharCode(...bytes));
  }

  /**
   * unpackBytes(format): unpack values from the string's characters, as
   * bytes (they must be in the range 0 to 255).
   */
  private unpackBytes(vmFormat: VmData): VmData {
    let bytes = Array.from(this.value).map((c) => {
      let cp = c.codePointAt(0);
      if(cp > 255) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
      return cp;
    });
    return new VmList(MetaString.packer.unpack(bytes, 0, vmFormat.unpack()).values);
  }

  /**
   * Checks for a match to the given target value, at the given starting position in the subject string (self). 
   * @param vmTarget Target to search for (string or RexPattern)
   * @param vmIndex Index to search at
   * @returns Length of match found, or nil for no match.
   */
  private match(vmTarget: VmData, vmIndex?: VmInt): VmInt | VmNil {
    // If target is a regular string, convert it to an escaped RexPattern
    // so we can use regexp functions.
    let target = vmTarget.unpack();
    if(typeof(target) == 'string') target = RexPattern.escape(target);
    if(!(target instanceof RexPattern)) throw('String.match: unsupported argument');

    return builtin_rexMatch(vmTarget, new VmSstring(this.value), vmIndex);
  }  
  
  private sha256(): VmData {
    let hash = SHA256(this.value).toString().toUpperCase();
    return new VmSstring(hash);
  }

  private splice(vmindex: VmInt, vmdeleteLength: VmInt, vminsertString?: VmObject): VmData {
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
    return new VmSstring(result);
  }

  private split(vmDelim?: VmData, vmLimit?: VmInt): VmData {
    // If no delimiter specified (or nil), use 1 (split into 1-character substrings)
    let delim = (vmDelim && !(vmDelim instanceof VmNil)) ? vmDelim.unpack() : 1;
    
    // Limit is a VmInt. If no VmInt present (or nil), use 0 for no limit.
    let limit: number = (vmLimit instanceof VmInt) ? vmLimit.unpack() : 0;

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
    let metaParts: VmData[] = parts.map((x) => new VmSstring(x));

    return new VmList(metaParts);
  }

  private startsWith(vmStr: VmData): VmData {
    let str = vmStr.unpack();
    return this.value.startsWith(str) ? new VmTrue() : new VmNil();
  }

  private substr(vmStart: VmInt, vmLength?: VmInt): VmData {
    if(!(vmStart instanceof VmInt) || (vmLength && !(vmLength instanceof VmInt))) {
      throw new VmRuntimeError(VmErr.INT_VAL_REQD);
    }
    let start = vmStart.unpack() - 1;
    let length = vmLength ? vmLength.unpack() : null;

    let out;
    // Negative start means an offset from the end of the string.
    // A start of -1 means the last character.
    if(start < 0) {
      start = this.value.length + start + 1;
    }
    // No length
    if(length === null) {
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

    return new VmSstring(out);
  }

  private toFoldedCase(): VmData {
    return new VmSstring(this.value.toUpperCase().toLowerCase());
  }

  private toLower(): VmData {
    return new VmSstring(this.value.toLowerCase());
  }  

  /**
   * Converts each character to title case: upper case, except that a
   * character whose upper case is several letters (a ligature, or 'ß')
   * becomes a capital followed by small letters ('ß' -> 'Ss').
   * @returns Converted string
   */
  private toTitleCase(): VmData {
    let out = Array.from(this.value).map((c) => {
      let u = Array.from(c.toUpperCase());
      return u.length > 1 ? u[0] + u.slice(1).join('').toLowerCase() : u[0];
    }).join('');
    return new VmSstring(out);
  }

  private toUpper(): VmData {
    return new VmSstring(this.value.toUpperCase());
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
      return new VmList(codes);
    }
  }

  /**
   * Decodes a URL-encoded string: '+' becomes a space and %xx sequences
   * (including multi-byte UTF-8 sequences) become characters; a %xx
   * sequence that isn't valid UTF-8 becomes '?'.
   * @returns Decoded string
   */
  private urlDecode(): VmData {
    let out = '';
    let s = this.value;
    let isHex = (j: number) => s[j] == '%' && /^[0-9a-fA-F]{2}$/.test(s.substr(j + 1, 2));
    let i = 0;
    while(i < s.length) {
      if(s[i] == '+') { out += ' '; i++; continue; }
      if(!isHex(i)) { out += s[i]; i++; continue; }
      // Collect a run of %xx bytes and decode them as UTF-8.
      let bytes: number[] = [];
      while(isHex(i)) {
        bytes.push(parseInt(s.substr(i + 1, 2), 16));
        i += 3;
      }
      out += decodeUtf8(bytes);
    }
    return new VmSstring(out);
  }

  /**
   * Encodes a string for use in a URL parameter: ASCII letters, digits,
   * '-' and '_' are kept, spaces become '+', and everything else becomes
   * %XX (using UTF-8 for non-ASCII characters).
   * @returns Encoded string
   */
  private urlEncode(): VmData {
    let out = '';
    for(let c of Array.from(this.value)) {
      if(/^[A-Za-z0-9_-]$/.test(c)) out += c;
      else if(c == ' ') out += '+';
      else for(let b of encodeUtf8(c)) out += '%' + (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }
    return new VmSstring(out);
  }

  /**
   * Finds the last (rightmost) match of a string or RexPattern that lies
   * before the given index (0 or omitted: the end of the string; negative
   * counts from the end).
   * @param vmTarget String or RexPattern to search for
   * @param vmIndex Index before which the match must lie
   * @returns Index of the start of the match, or nil
   */
  private findLast(vmTarget: VmData, vmIndex?: VmData): VmInt | VmNil {
    let s = this.value;
    let idx = (vmIndex instanceof VmInt) ? vmIndex.unpack() : 0;
    // 0-based exclusive end of the region to search
    let end = idx == 0 ? s.length : (idx < 0 ? s.length + idx : idx - 1);
    end = Math.max(0, Math.min(end, s.length));
    let region = s.substr(0, end);

    let target = vmTarget.unpack();
    if(typeof(target) == 'string') {
      let pos = region.lastIndexOf(target);
      return pos < 0 ? new VmNil() : new VmInt(pos + 1);
    }
    if(!(target instanceof RexPattern)) throw('String.findLast: string or RexPattern expected');

    // The match whose right end is furthest right wins; among those, the
    // one that starts furthest left.
    let m: Match = target.getRegExp().execLast(s, end);
    Vm.getInstance().match = m;
    return m ? new VmInt(m.index + 1) : new VmNil();
  }

  /**
   * Translates TADS formatting codes to plain text.
   * @param vmState Optional state object carrying context between calls
   * @returns Translated string
   */
  private specialsToText(vmState?: VmData): VmData {
    return this.specials(false, vmState);
  }

  /**
   * Translates TADS formatting codes to standard HTML.
   * @param vmState Optional state object carrying context between calls
   * @returns Translated string
   */
  private specialsToHtml(vmState?: VmData): VmData {
    return this.specials(true, vmState);
  }

  /**
   * Shared implementation of specialsToText/specialsToHtml. The state
   * object's flags_ and tag_ properties are found through the symbols the
   * library exports for them.
   */
  private specials(html: boolean, vmState?: VmData): VmData {
    let state: ISpecialsState = { flags: 0, tag: '' };
    let obj = (vmState instanceof VmObject) ? vmState : null;
    let flagsProp = Symbols.get('String.specialsToHtml.flags') as VmProp;
    let tagProp = Symbols.get('String.specialsToHtml.tag') as VmProp;
    if(obj && flagsProp) {
      let f = Vm.getInstance().callMethod(obj, flagsProp);
      if(f instanceof VmInt) state.flags = f.unpack();
    }
    if(obj && tagProp) {
      let t = Vm.getInstance().callMethod(obj, tagProp).unpack();
      if(typeof(t) == 'string') state.tag = t;
    }
    let out = translateSpecials(this.value, html, state);
    if(obj && flagsProp) obj.setprop(flagsProp.value, new VmInt(state.flags));
    if(obj && tagProp) obj.setprop(tagProp.value, new VmSstring(state.tag));
    return new VmSstring(out);
  }

  getValue() {
    return this.value;
  }  
}


/**
 * Encode one character (code point) as UTF-8 bytes.
 */
function encodeUtf8(c: string): number[] {
  let cp = c.codePointAt(0);
  if(cp < 0x80) return [cp];
  if(cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)];
  if(cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
}

/**
 * Decode UTF-8 bytes; each byte that doesn't start a valid sequence
 * becomes '?'.
 */
function decodeUtf8(bytes: number[]): string {
  let out = '';
  let i = 0;
  while(i < bytes.length) {
    let b = bytes[i];
    // Number of continuation bytes, or -1 for an invalid lead byte.
    let n = b < 0x80 ? 0 : (b & 0xe0) == 0xc0 ? 1 : (b & 0xf0) == 0xe0 ? 2 : (b & 0xf8) == 0xf0 ? 3 : -1;
    let cp = n <= 0 ? b : b & (0x3f >> n);
    let ok = n >= 0 && i + n < bytes.length;
    for(let k = 1; ok && k <= n; k++) {
      let c = bytes[i + k];
      if((c & 0xc0) != 0x80) ok = false;
      else cp = (cp << 6) | (c & 0x3f);
    }
    if(!ok) { out += '?'; i++; continue; }
    out += String.fromCodePoint(cp);
    i += n + 1;
  }
  return out;
}

MetaclassRegistry.register('string/030008', MetaString);

export { MetaString }