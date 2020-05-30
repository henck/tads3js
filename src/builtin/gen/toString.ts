import { VmData, VmInt, VmObject } from "../../types";
import { MetaString } from "../../metaimp";

/**
 * Convert the value given by val to a string.
 * @param val Value to convert
 * @param radix Optional radix. Defaults to 10.
 * @param isSigned true is value is a signed value
 * @returns MetaString instance
 */

export function builtin_toString(val: VmData, radix?: VmInt, isSigned?: VmData): VmObject {
  return new VmObject(new MetaString(val.toStr(radix ? radix.value : undefined, isSigned ? isSigned.value : undefined)));
}

