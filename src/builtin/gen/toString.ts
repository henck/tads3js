import { VmData, VmInt, VmObject } from "../../types";
import { MetaString } from "../../metaimp";

/**
 * Convert the value given by val to a string.
 * @param val Value to convert
 * @param radix Optional radix. Defaults to 10.
 * @param isSigned true is value is a signed value
 * @returns MetaString instance
 * 
 * @todo BigNumber support
 * @todo Date support
 * @todo TimeZone support
 * @todo FileName support
 * @todo reflectionServices support
 */
export function builtin_toString(val: VmData, radix?: VmInt, isSigned?: VmData): VmObject {
  let str = val.toStr(radix ? radix.value : undefined, isSigned ? isSigned.value : undefined);
  return new VmObject(new MetaString(str));
}

