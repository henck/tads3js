import { Stack } from "../Stack";
import { VmData, VmInt } from "../types";

function builtin_dataType(stack: Stack, val: VmData): VmInt {
  throw('dataType: not implemented');
}

export { builtin_dataType as dataType }