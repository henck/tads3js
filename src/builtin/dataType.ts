import { Stack } from "../Stack";
import { VmData, VmInt } from "../types";

/**
 * Returns the datatype of the given value. 
 * @param stack 
 * @param val Value to convert
 * @returns Datatype value (TypeXXX)
 */
export function builtin_dataType(stack: Stack, val: VmData): VmInt {
  throw('dataType: not implemented');
}

