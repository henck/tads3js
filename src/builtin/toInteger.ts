import { VmData, VmInt, VmNil, VmTrue, VmObject, VmSstring } from "../types";
import { MetaString, BigNumber } from "../metaimp";

/**
 * Convert the value given by val to an integer.
 * @param val Value to convert
 * @param radix Optional radix. Defaults to 10.
 * @returns VmInt instance
 */
export function builtin_toInteger(val: VmData, radix?: VmInt): VmInt {
  if(val instanceof VmInt) return val;
  if(val instanceof VmNil) return new VmInt(0);
  if(val instanceof VmTrue) return new VmInt(1);
  if(val instanceof VmObject && val.getInstance() instanceof BigNumber) {
    return new VmInt(0);
    // TODO: Needs proper BigNumber support.
  }
  if(val instanceof VmSstring || (val instanceof VmObject && val.getInstance() instanceof MetaString)) {
    let str:string = val.unpack();
    if(str == 'nil') return new VmInt(0);
    if(str == 'true') return new VmInt(1);
    str = str.trim();
    let int = parseInt(str, radix ? radix.unpack() : 10);
    return new VmInt(int);
  }
  throw('Invalid type for built-in');
}


