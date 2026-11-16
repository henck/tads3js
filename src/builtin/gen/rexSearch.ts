import { VmData, VmInt, VmNil, VmSstring, VmList } from "../../types";
import { RexPattern } from "../../metaimp";
import { Match } from "../../regexp/TadsRegex";
import { Vm } from "../../Vm";

/**
 * Get a RexPattern from a pattern argument (a string or RexPattern).
 */
// Compiled patterns for pattern strings (which games tend to use repeatedly).
// (These are only used internally, so it doesn't matter if the garbage
// collector removes them from the heap.)
const patternCache = new Map<string, RexPattern>();

export function toRexPattern(vmPat: VmData): RexPattern {
  let pat = vmPat.unpack();
  if(typeof(pat) != 'string') return pat;
  let rex = patternCache.get(pat);
  if(!rex) {
    if(patternCache.size >= 500) patternCache.clear();
    rex = new RexPattern(pat);
    patternCache.set(pat, rex);
  }
  return rex;
}

/**
 * Convert a 1-based index argument (negative counts from the end) to a
 * 0-based position; default 0.
 */
export function startIndex(str: string, vmIndex?: VmData): number {
  let index = (vmIndex instanceof VmInt) ? vmIndex.unpack() : 1;
  return index <= 0 ? str.length + index : index - 1;
}

/**
 * Searches for the regular expression pat in the search string str, starting at the
 * character position index. Sets the rexGroup() registers.
 * @param vmPat Pattern to search for (string or RexPattern)
 * @param vmStr String to search in
 * @param vmIndex Index to start at
 * @returns [index, length, text] of the match, or nil for no match
 */
export function builtin_rexSearch(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  let str: string = vmStr.unpack();
  let m: Match = toRexPattern(vmPat).getRegExp().exec(str, startIndex(str, vmIndex));
  Vm.getInstance().match = m;
  if(m == null) return new VmNil();
  return new VmList([new VmInt(m.index + 1), new VmInt(m.length), new VmSstring(m.value)]);
}
