import { VmData, VmInt, VmNil, VmList, VmSstring } from "../../types";
import { Vm } from "../../Vm";

/**
 * Returns the least argument value
 * @param args Arguments to compare
 * @returns Greatest value
 * @throws Error if values are not comparable, or if there are no values.
 */
export function builtin_rexGroup(vmGroupNum: VmInt): VmData {
  let groupNum = vmGroupNum.unpack();
  let match:any = Vm.getInstance().match;
  
  // No match, or not enough groups?
  if(match == null || groupNum >= match.index.length) return new VmNil();

  return new VmList([
    new VmInt(match.index[groupNum]),
    new VmInt(match[groupNum].length),
    new VmSstring(match[groupNum])
  ]);
}

