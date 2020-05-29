import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject, VmNativeCode } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from "./MetaString";

class RexPattern extends RootObject {
  static NamedCharacters: Map<string, string> = new Map<string, string>([
    ['lparen',  '\\('],
    ['rparen',  '\\)'],
    ['lsquare', '\\['],
    ['rsquare', '\\]'],
    ['lbrace',  '\\{'],
    ['rbrace',  '\\}'],
    ['langle',  '\\<'],
    ['rangle',  '\\>'],
    ['vbar',    '\\|'],
    ['caret',   '\\^'],
    ['period',  '\\.'],
    ['dot',     '\\.'],
    ['squote',  '\\\''],
    ['dquote',  '\\"'],
    ['star',    '\\*'],
    ['plus',    '\\+'],
    ['percent', '\\%'],
    ['question', '\\?'],
    ['dollar',  '\\$'],
    ['backslash', '\\\\'],
    ['return',  '\\n'],
    ['linefeed', '\\r'],
    ['tab',     '\\t'],
    ['nul',     '\\0'],
    ['null',    '\\0']
  ]);

  static CharacterClasses: Map<string, string> = new Map<string, string>([
    ['alpha', 'A-Za-z'],
    ['upper', 'A-Z'],
    ['lower', 'a-z'],
    ['digit', '0-9'],
    ['alphanum', 'A-Za-z0-9'],
    ['space', ' \t'],
    ['vspace', '\r\n\b'],
    ['punct', '\,\.\?\:\!'],
    ['newline', '\n\r\b']
  ]);

  private magic: number;
  private value: string;
  private regexp: RegExp;

  constructor(magic: number, value: string) {
    super();
    this.magic = magic;
    this.value = value;

    // In T3, % is used as a backslash.
    this.value = this.value.replace('%', '\\');

    // Replace character names and character classes:
    let parsedValue = this.value.replace(/\<[^\>]*\>/g, (substr:string) => {
      let content = substr.substr(1, substr.length - 2); // string minus angle brackets
      let negate = content.startsWith('^'); if(negate) content = content.substr(1);
      let parts = content.split('|');
      parts = parts.map((part) => {
        RexPattern.CharacterClasses.forEach((value, key) => {
          if(part.toLowerCase() == key) part = value;
        });
        RexPattern.NamedCharacters.forEach((value, key) => {
          if(part.toLowerCase() == key) part = value;
        });
        return part;
      });
      return `[${negate ? '^' : ''}${parts.join('')}]`;
    });

    this.regexp = new RegExp(parsedValue);
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let magic = image.getUInt8(offset);
    let strOffset = image.getUInt32(offset + 1);
    let value = dataPool.getString(strOffset);    
    return new RexPattern(magic, value);
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode(this.getPatternString, 0);
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