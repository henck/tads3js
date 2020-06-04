import { VmData, VmInt, VmNil } from "../../types";

/**
 * Searches the string str backwards from the end for a match to the regular 
 * expression pat, starting at the character position index.
 * rexSearchLast is not used by Adv3.
 * An implementation is not (yet) necessary.
 * @param vmPat Pattern to search for (string or RexPattern)
 * @param vmStr String to search in
 * @param vmIndex Index to start at
 * @returns list with match info, or nil for no match
 */
export function builtin_rexSearchLast(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  return new VmNil();
}

