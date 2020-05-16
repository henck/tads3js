import { Stack } from "../Stack";
import { VmData, VmInt } from "../types";

export function builtin_dataType(stack: Stack, val: VmData): VmInt {
  throw('dataType: not implemented');
}

