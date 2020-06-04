import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject, VmNativeCode, VmSstring, VmData } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from "./MetaString";
import { RexClasses } from '../regexp/RexClasses';

import { RegExpPlus } from '../regexp/RegExpPlus';

class RexPattern extends RootObject {
  private value: string;
  private parsedValue: string;
  private regexp: RegExpPlus;

  constructor(value: VmData) {
    super();
    this.value = value.unpack();

    let caseSensitive = true;
    this.parsedValue = this.value;

    // See if there's a <NoCase> in the string.
    this.parsedValue = this.parsedValue.replace(/<nocase>/ig, (x) => {
      caseSensitive = false;
      return '';
    });

    // See if there's a <Min> in the string.
    let hasMin = false;
    this.parsedValue = this.parsedValue.replace(/<min>/ig, (x) => {
      hasMin = true;
      return '';
    });
    // If <Min> was specified, then we need to make * non-greedy.
    if(hasMin) this.parsedValue = this.parsedValue.replace('*', '*?');

    // Remove other flags:
    // These flags are never used in Adv3.
    ['<fb>', '<firstbegin>', '<fe>', '<firstend>', '<max>'].forEach((flag) => {
      this.parsedValue = this.parsedValue.replace(new RegExp(flag, 'ig'), '');
    });

    // Replace % sequences with character classes:
    this.parsedValue = this.parsedValue.replace(/%d/g, '<digit>');
    this.parsedValue = this.parsedValue.replace(/%D/g, '<^digit>');
    this.parsedValue = this.parsedValue.replace(/%s/g, '<space>');
    this.parsedValue = this.parsedValue.replace(/%S/g, '<^space>');
    this.parsedValue = this.parsedValue.replace(/%v/g, '<vspace>');
    this.parsedValue = this.parsedValue.replace(/%V/g, '<^vspace>');
    this.parsedValue = this.parsedValue.replace(/%w/g, '<alphanum>');
    this.parsedValue = this.parsedValue.replace(/%W/g, '<^alphanum>');

    // Start-of-word and end-of-word are converted to ordinary word boundaries.
    this.parsedValue = this.parsedValue.replace(/%</g, '\\b');
    this.parsedValue = this.parsedValue.replace(/%>/g, '\\b');

    // In T3, % is used as a backslash.
    this.parsedValue = this.parsedValue.replace(/%([^%<>])/g, '\\$1');

    // In T3, character names and classes are written using angle brackets < and >.
    // We must replace this with rectangular brackets.
    // <x>                => [x]
    // <lparen>           => [\(]
    // <period|plus|star> => [\.\+\*]
    // <^question>        => [^\?]
    this.parsedValue = this.parsedValue.replace(/\<[^\<\>]*\>/g, (substr:string) => {
      let content = substr.substr(1, substr.length - 2); // string minus angle brackets
      // Does exp start with a negation?
      // A ^ not in the first position is taken by JS as a literal ^, just like T3,
      // so no special treatment needed.
      let negate = content.startsWith('^'); if(negate) content = content.substr(1);

      // Escape hyphens:
      content = content.replace(/-/g, '\\');

      let parts = content.split('|');
      parts = parts.map((part) => {
        RexClasses.CharacterClasses.forEach((value, key) => {
          if(part.toLowerCase() == key) part = value;
        });
        RexClasses.NamedCharacters.forEach((value, key) => {
          if(part.toLowerCase() == key) part = value;
        });
        return part;
      });
      return `[${negate ? '^' : ''}${parts.join('')}]`;
    });

    this.regexp = new RegExpPlus(this.parsedValue, (!caseSensitive) ? 'i' : '');
  }

  /**
   * Create an escaped RexPattern, where it matches only the original string.
   * All special characters are escaped.
   * @param str String
   * @returns RexPattern instance
   */
  static escape(str: string) {
    // Escape any regex chars:
    str = str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    let pat = new RexPattern(new VmSstring(''));
    pat.value = str;
    pat.parsedValue = str;
    pat.regexp = new RegExpPlus(str, '');
    return pat;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject { 
    // Skip dataholder type. We can ignore this, because we know the data is a string.
    offset++;
    // Load string offset in datapool:
    let strOffset = image.getUInt32(offset);
    // Load string from datapool.
    let value = dataPool.getString(strOffset);    

    // Adv3 bugfix. There is a regexp with an unterminated group.
    if(value == '([`\'"\u2018\u201C](.*)') {
      value = '[`\'"\u2018\u201C](.*)';
    }
 
    // Show RegExp as it was loaded from the image:
    // console.log("RX LOADED: ", value);

    return new RexPattern(new VmSstring(value));
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("RexPattern.getPatternString", this.getPatternString, 0);
    }
    return null;
  }

  /*
   * Virtual methods
   */

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value;
  }   

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private getPatternString(): VmObject {
    return new VmObject(new MetaString(this.value));
  }

  getRegExp() {
    return this.regexp;
  }

  getValue() {
    return this.value;
  }  
}

MetaclassRegistry.register('regex-pattern/030000', RexPattern);

export { RexPattern }