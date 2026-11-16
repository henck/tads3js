import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmNativeCode } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";

// matchValues() result flags
const RF_MATCH = 0x0001;
const RF_CASEFOLD = 0x0002;
const RF_TRUNC = 0x0004;

/**
 * An equivalence mapping: input text 'value' may match the reference
 * character the mapping is stored under.
 */
interface IEquivalence {
  value: string[];       // input characters
  ucFlags: number;       // flags when the input starts with an upper-case letter
  lcFlags: number;       // flags otherwise
}

/**
 * Case-fold a character. JavaScript has no case folding function;
 * upper-casing then lower-casing approximates Unicode full case folding
 * (e.g. 'ß' -> 'ss', 'É' -> 'é').
 */
function caseFold(ch: string): string {
  return ch.toUpperCase().toLowerCase();
}

function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

/**
 * Case-insensitively match the shortest stretch of a[ai..] against the
 * shortest stretch of b[bi..] whose case-folded forms are equal (either
 * side may expand, as 'ss' and 'ß' do).
 * @returns New positions in a and b, or null if they don't match
 */
function foldMatch(a: string[], ai: number, b: string[], bi: number): { ai: number, bi: number } {
  let fa = caseFold(a[ai++]);
  let fb = caseFold(b[bi++]);
  while(fa !== fb) {
    if(fa.length < fb.length && fb.startsWith(fa) && ai < a.length) fa += caseFold(a[ai++]);
    else if(fb.length < fa.length && fa.startsWith(fb) && bi < b.length) fb += caseFold(b[bi++]);
    else return null;
  }
  return { ai: ai, bi: bi };
}

/**
 * StringComparator: a native comparator for Dictionary objects, with
 * optional case folding, truncation and character equivalence mappings.
 * Matching and hashing follow the reference implementation (vmstrcmp.cpp).
 */
class StringComparator extends RootObject {
  private truncLen: number;
  private caseSensitive: boolean;
  // Equivalence mappings, by reference character.
  private equivalences: Map<string, IEquivalence>;

  /**
   * new StringComparator(truncLen, caseSensitive, mappings)
   * @param vmTruncLen Minimum truncation length; nil or 0 for no truncation
   * @param vmCaseSensitive true for case-sensitive matching
   * @param vmMappings nil, or list of [refChar, inputStr, ucFlags, lcFlags]
   */
  constructor(vmTruncLen?: VmData, vmCaseSensitive?: VmData, vmMappings?: VmData) {
    super();
    this.truncLen = (vmTruncLen instanceof VmInt) ? vmTruncLen.unpack() : 0;
    this.caseSensitive = vmCaseSensitive ? vmCaseSensitive.isTruthy() : false;
    this.equivalences = new Map();
    if(vmMappings && !(vmMappings instanceof VmNil)) {
      let mappings = vmMappings.unpack();
      if(!Array.isArray(mappings)) throw('StringComparator: list of mappings expected');
      mappings.forEach((m: VmData) => {
        let [ref, value, uc, lc] = m.unpack() as VmData[];
        if(!ref || !value || !uc || !lc) throw('StringComparator: bad mapping');
        let refStr: string = ref.unpack();
        let valueStr: string = value.unpack();
        if(refStr.length == 0 || valueStr.length == 0) throw('StringComparator: empty mapping string');
        this.addEquivalence(Array.from(refStr)[0], Array.from(valueStr), uc.unpack(), lc.unpack());
      });
    }
  }

  private addEquivalence(ref: string, value: string[], ucFlags: number, lcFlags: number) {
    // A later mapping for the same reference character replaces an earlier one.
    this.equivalences.set(ref, { value: value, ucFlags: ucFlags, lcFlags: lcFlags });
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let comp = new StringComparator();
    comp.truncLen = image.getUInt16(offset);
    comp.caseSensitive = (image.getUInt16(offset + 2) & 0x0001) != 0;
    let count = image.getUInt16(offset + 4);
    // offset + 6: total number of value characters (not needed)
    offset += 8;
    for(let i = 0; i < count; i++) {
      let ref = String.fromCharCode(image.getUInt16(offset));
      let len = image.getUInt8(offset + 2);
      let ucFlags = image.getUInt32(offset + 3);
      let lcFlags = image.getUInt32(offset + 7);
      offset += 11;
      let value: string[] = [];
      for(let j = 0; j < len; j++) {
        value.push(String.fromCharCode(image.getUInt16(offset)));
        offset += 2;
      }
      comp.addEquivalence(ref, value, ucFlags, lcFlags);
    }
    return comp;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("StringComparator.calcHash", this.calcHash, 1);
      case 1: return new VmNativeCode("StringComparator.matchValues", this.matchValues, 2);
    }
    return null;
  }

  /**
   * Compare an input string with a reference (dictionary) string.
   * @returns 0 for no match, or RF_MATCH combined with RF_CASEFOLD,
   * RF_TRUNC and the flags of any equivalence mappings used
   */
  public match(input: string, reference: string): number {
    let val = Array.from(input);
    let ref = Array.from(reference);
    let fold = !this.caseSensitive;
    let ret = 0;
    let vi = 0, ri = 0;

    while(vi < val.length && ri < ref.length) {
      // Exact match
      if(val[vi] === ref[ri]) { vi++; ri++; continue; }

      // Case-insensitive match
      if(fold) {
        let r = foldMatch(val, vi, ref, ri);
        if(r) { vi = r.ai; ri = r.bi; ret |= RF_CASEFOLD; continue; }
      }

      // Equivalence mapping for the reference character
      let eq = this.equivalences.get(ref[ri]);
      if(!eq) return 0;
      let first = val[vi];
      let k = 0;
      while(k < eq.value.length && vi < val.length) {
        // Note: the reference VM compares each mapping character with the
        // *first* input character matched by the mapping, not the current
        // one, so for a mapping 'ß' -> 'ss', the input 'sx' matches too.
        // We replicate that, since real interpreters behave this way.
        if(eq.value[k] === first) { vi++; k++; continue; }
        if(fold) {
          let r = foldMatch(val, vi, eq.value, k);
          if(r) { vi = r.ai; k = r.bi; ret |= RF_CASEFOLD; continue; }
        }
        return 0;
      }
      if(k < eq.value.length) return 0;
      ret |= isUpper(first) ? eq.ucFlags : eq.lcFlags;
      ri++;
    }

    if(vi == val.length && ri == ref.length) return ret | RF_MATCH;
    if(vi < val.length) return 0;           // input longer than reference
    // The input is a truncated form of the reference string.
    if(this.truncLen != 0 && val.length >= this.truncLen) return ret | RF_MATCH | RF_TRUNC;
    return 0;
  }

  /** Minimum truncation length, or 0 if truncation isn't allowed. */
  public getTruncLen(): number {
    return this.truncLen;
  }

  /**
   * Do an input character and a reference character match, allowing for
   * case folding and single-character equivalence mappings? Used by
   * Dictionary.correctSpelling, where these approximations aren't edits.
   */
  public charEquals(input: string, ref: string): boolean {
    let fold = !this.caseSensitive;
    if(input === ref) return true;
    if(fold && caseFold(input) === caseFold(ref)) return true;
    let eq = this.equivalences.get(ref);
    if(eq && eq.value.length == 1) {
      let v = eq.value[0];
      return v === input || (fold && caseFold(v) === caseFold(input));
    }
    return false;
  }

  /**
   * Hash a string: a 16-bit sum of its characters, after case folding
   * and equivalence mapping, limited to the truncation length, so that
   * strings that match always hash equally.
   */
  public hash(str: string): number {
    let hash = 0;
    let remaining = this.truncLen;
    let fold = !this.caseSensitive;
    // Add one character; returns false once the truncation length is reached.
    let add = (s: string): boolean => {
      for(let u of Array.from(s)) {
        hash = (hash + u.codePointAt(0)) & 0xFFFF;
        if(this.truncLen != 0 && --remaining == 0) return false;
      }
      return true;
    };

    for(let ch of Array.from(str)) {
      let folded = fold ? caseFold(ch) : ch;
      let single = Array.from(folded).length == 1 ? folded : null;
      let eq = this.equivalences.get(ch) ?? (fold && single ? this.equivalences.get(single) : undefined);
      if(eq) {
        for(let vc of eq.value) if(!add(fold ? caseFold(vc) : vc)) return hash;
      } else {
        if(!add(folded)) return hash;
      }
    }
    return hash;
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  /**
   * Calculate the hash value for a string.
   * @param vmStr String
   * @returns Hash value
   */
  private calcHash(vmStr: VmData): VmInt {
    return new VmInt(this.hash(vmStr.unpack()));
  }

  /**
   * Compare an input string with a reference string.
   * @param vmInput Input string
   * @param vmRef Reference string
   * @returns Match flags, or 0 for no match
   */
  private matchValues(vmInput: VmData, vmRef: VmData): VmInt {
    return new VmInt(this.match(vmInput.unpack(), vmRef.unpack()));
  }
}

MetaclassRegistry.register('string-comparator/030000', StringComparator);

export { StringComparator }
