import { VmData, VmInt, VmNil, VmSstring, VmList } from "../../types";
import { Match } from "../../regexp/TadsRegex";
import { Vm } from "../../Vm";
import { toRexPattern } from "./rexSearch";

/**
 * Searches backwards for the last match of the pattern that lies before
 * the given index (0 or omitted: the whole string; negative counts from
 * the end). Sets the rexGroup() registers.
 * @param vmPat Pattern (string or RexPattern)
 * @param vmStr String
 * @param vmIndex Index before which the match must end
 * @returns [index, length, text] of the match, or nil
 */
export function builtin_rexSearchLast(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  let str: string = vmStr.unpack();
  let idx = (vmIndex instanceof VmInt) ? vmIndex.unpack() : 0;
  let end = idx == 0 ? str.length : (idx < 0 ? str.length + idx : idx - 1);
  let m: Match = toRexPattern(vmPat).getRegExp().execLast(str, end);
  Vm.getInstance().match = m;
  if(m == null) return new VmNil();
  return new VmList([new VmInt(m.index + 1), new VmInt(m.length), new VmSstring(m.value)]);
}
