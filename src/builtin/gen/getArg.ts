import { VmRuntimeError, VmErr } from '../../VmErrors';
import { VmInt, VmData } from "../../types";
import { Vm } from "../../Vm";

/**
 * Retrieve the given argument to the current function.
 * @param idx Argument index (1-based)
 * @returns Argument value
 */
export function builtin_getArg(idx: VmInt): VmData {
  let stack = Vm.getInstance().stack;
  let n = idx.unpack();
  if(n < 1 || n > stack.getArgCount()) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  return stack.getArg(n - 1);
}
