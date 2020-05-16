import { Stack } from "../Stack";
import { VmInt, VmData } from "../types";

export function builtin_getArg(stack: Stack, idx: VmInt): VmData {
  return stack.getArg(idx.value - 1);
}
