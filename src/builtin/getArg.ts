import { Stack } from "../Stack";
import { VmInt, VmData } from "../types";

/**
 * Retrieve the given argument to the current function.
 * @param stack 
 * @param idx Argument index (1-based)
 * @returns Argument value
 */
export function builtin_getArg(stack: Stack, idx: VmInt): VmData {
  return stack.getArg(idx.value - 1);
}
