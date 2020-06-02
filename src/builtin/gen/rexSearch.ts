import { VmData, VmInt, VmNil, VmSstring, VmList } from "../../types";
import { RexPattern } from "../../metaimp";

/**
 * Searches for the regular expression pat in the search string str, starting at the character position index.
  * @param vmPat Pattern to search for (string or RexPattern)
 * @param vmStr String to search in
 * @param vmIndex Index to start at
 * @returns list with match info, or nil for no match
 */
export function builtin_rexSearch(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  let pat = vmPat.unpack(); // rx is a string or a RexPattern instance
  // If a string was given, create a RexPattern.
  if(typeof(pat) == 'string') pat = new RexPattern(new VmSstring(pat));
  // rx is now a RexPattern instance

  // Read input string
  let str: string = vmStr.unpack();

  // Read index and convert to 0-based.
  let index = vmIndex ? vmIndex.unpack() : 1;
  index = index <= 0 ? str.length + index : index - 1;

  // Perform match:
  let m: any = (pat as RexPattern).getRegExp().exec(str, index);

  // If no match, or match does not start at specified index, return nil.
  if(m == null) return new VmNil();

  return new VmList([
    new VmInt(m.index[0] + 1),
    new VmInt(m[0].length),
    new VmSstring(m[0])
  ]);
}

