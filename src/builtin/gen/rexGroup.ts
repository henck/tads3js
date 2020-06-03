import { VmData, VmInt, VmNil, VmList, VmSstring } from "../../types";
import { Vm } from "../../Vm";
import { Match } from "../../regexp/RegExpPlus";

/**
 * Returns the least argument value
 * @param args Arguments to compare
 * @returns Greatest value
 * @throws Error if values are not comparable, or if there are no values.
 */
export function builtin_rexGroup(vmGroupNum: VmInt): VmData {
  let groupNum = vmGroupNum.unpack();
  let match: Match = Vm.getInstance().match;
  
  // No match, or not enough groups?
  if(match == null || groupNum >= match.groups.length) return new VmNil();

  return new VmList([
    new VmInt(match.groups[groupNum].index + 1), // Make this 1-based for TADS
    new VmInt(match.groups[groupNum].length),
    new VmSstring(match.groups[groupNum].value)
  ]);
}

