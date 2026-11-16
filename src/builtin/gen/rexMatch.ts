import { VmData, VmInt, VmNil } from "../../types";
import { Match } from "../../regexp/TadsRegex";
import { Vm } from "../../Vm";
import { toRexPattern, startIndex } from "./rexSearch";

/**
 * Tries to match the pattern exactly at the given index of the string.
 * Sets the rexGroup() registers.
 * @param vmPat Pattern (string or RexPattern)
 * @param vmStr String
 * @param vmIndex Index (default 1)
 * @returns Length of the match, or nil
 */
export function builtin_rexMatch(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  let str: string = vmStr.unpack();
  let m: Match = toRexPattern(vmPat).getRegExp().matchAt(str, startIndex(str, vmIndex));
  Vm.getInstance().match = m;
  return m == null ? new VmNil() : new VmInt(m.length);
}
