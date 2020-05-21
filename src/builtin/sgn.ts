import { VmInt, VmData } from "../types";

/**
 * Returns the sign of the given number. 
 * @param vmVal Value to check
 * @returns 1 if positive, 0 if zero, -1 if negative
 */
export function builtin_sgn(vmVal: VmData): VmInt {
  if(vmVal instanceof VmInt) {
    let val = vmVal.unpack();
    if(val < 0) return new VmInt(-1);
    if(val > 0) return new VmInt(1);
    return new VmInt(0);
  }
  // TODO: Missing support for BigNumber
  throw('sgn: Data type not supported.');
}

