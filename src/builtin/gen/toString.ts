import { VmData, VmInt, VmObject, VmList, VmSstring } from "../../types";
import { MetaString } from "../../metaimp";
import { ListBase } from "../../metaimp/ListBase";

/**
 * Convert a value to a string. Integers can use any radix (2 to 36); they
 * are signed by default only in radix 10. List elements are converted
 * with the same radix and are separated by commas.
 */
export function toStringWith(val: VmData, radix: number, isSigned: boolean): string {
  if(val instanceof VmInt) {
    let v = val.unpack();
    if(!isSigned) return (v >>> 0).toString(radix).toUpperCase();
    return (v < 0 ? '-' : '') + Math.abs(v).toString(radix).toUpperCase();
  }
  let elements: VmData[] = null;
  if(val instanceof VmList) elements = val.value;
  else if(val instanceof VmObject && val.getInstance() instanceof ListBase) elements = val.getInstance().getValue();
  if(elements) return elements.map((e) => toStringWith(e, radix, isSigned)).join(',');
  return val.toStr(radix);
}

export function builtin_toString(val: VmData, vmRadix?: VmData, vmIsSigned?: VmData): VmData {
  let radix = (vmRadix instanceof VmInt) ? vmRadix.unpack() : 10;
  let isSigned = vmIsSigned !== undefined ? vmIsSigned.isTruthy() : radix == 10;
  return new VmSstring(toStringWith(val, radix, isSigned));
}
