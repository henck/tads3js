import { Stack } from "../Stack";
import { VmData, VmInt, VmObject } from "../types";
import { MetaString } from "../metaimp";

export function builtin_toString(stack: Stack, val: VmData, radix?: VmInt, isSigned?: VmData): VmObject {
  return new VmObject(new MetaString(val.toStr(radix ? radix.value : undefined, isSigned ? isSigned.value : undefined)));
}

