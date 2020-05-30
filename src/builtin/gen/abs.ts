import { VmInt, VmData } from "../../types";

/**
 * Returns the absolute value of the given number. 
 * @param vmVal Value to convert
 * @returns Absolute value
 */
export function builtin_abs(vmVal: VmData): VmData {
  if(vmVal instanceof VmInt) return new VmInt(Math.abs(vmVal.unpack()));
  return null; // TODO: Missing support for BigNumber
}

