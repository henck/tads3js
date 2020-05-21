import { VmInt, VmData } from "../types";
import { Vm } from "../Vm";

/**
 * Retrieve the given argument to the current function.
 * @param idx Argument index (1-based)
 * @returns Argument value
 */
export function builtin_getArg(idx: VmInt): VmData {
  return Vm.getInstance().stack.getArg(idx.value - 1);
}
