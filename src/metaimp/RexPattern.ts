import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject, VmNativeCode, VmData, VmSstring } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from "./MetaString";
import { TadsRegex } from '../regexp/TadsRegex';

/**
 * RexPattern: a compiled regular expression (in TADS pattern syntax).
 */
class RexPattern extends RootObject {
  private value: string;
  private regexp: TadsRegex;
  private noCase: boolean;

  // True if this pattern was made from a literal string (see escape()),
  // in which case % in replacement text has no special meaning.
  public isLiteral: boolean = false;

  constructor(value: VmData | string, noCase?: boolean) {
    super();
    this.value = typeof(value) == 'string' ? value : value.unpack();
    this.noCase = !!noCase;
    this.compile();
  }

  /** Compile the pattern (also used when the object is restored from a file). */
  public compile() {
    this.regexp = new TadsRegex(this.value, this.noCase);
  }

  /**
   * Create a RexPattern that matches only the given literal string.
   * @param str String
   * @returns RexPattern instance
   */
  static escape(str: string): RexPattern {
    // Quote special characters with %, except < and > (since %< and %>
    // are word anchors), which are written as named characters.
    let pattern = Array.from(str).map((c) =>
      c == '<' ? '<langle>' : c == '>' ? '<rangle>' : '%+.*?[^$|(){'.includes(c) ? '%' + c : c
    ).join('');
    let pat = new RexPattern(pattern);
    pat.isLiteral = true;
    return pat;
  }

  /**
   * Get a case-insensitive version of this pattern.
   */
  public withIgnoreCase(): RexPattern {
    let pat = new RexPattern(this.value, true);
    pat.isLiteral = this.isLiteral;
    return pat;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    // Skip dataholder type. We can ignore this, because we know the data is a string.
    offset++;
    // Load string offset in datapool:
    let strOffset = image.getUInt32(offset);
    // Load string from datapool.
    return new RexPattern(dataPool.getString(strOffset));
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

  private getPatternString(): VmData {
    return new VmSstring(this.value);
  }

  getRegExp(): TadsRegex {
    return this.regexp;
  }

  getValue() {
    return this.value;
  }
}

MetaclassRegistry.register('regex-pattern/030000', RexPattern);

export { RexPattern }
