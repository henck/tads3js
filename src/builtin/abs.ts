import { Stack } from "../Stack";
import { VmInt, VmData } from "../types";
import { BigNumber } from "../metaimp";

export function builtin_abs(stack: Stack, vmVal: VmData): VmData {
  if(vmVal instanceof VmInt) return new VmInt(Math.abs(vmVal.unpack()));
  return null; // TODO: Missing support for BigNumber
}

