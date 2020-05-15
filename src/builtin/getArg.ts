import { Stack } from "../Stack";
import { VmInt, VmData } from "../types";

function builtin_getArg(stack: Stack, idx: VmInt): VmData {
  return stack.getArg(idx.value - 1);
}

export { builtin_getArg as getArg }
