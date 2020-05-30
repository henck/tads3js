import { VmData, VmInt, VmNil, VmObject } from "../../types";
import { MetaString } from "../../metaimp";

export function builtin_rexReplace(vmPat: VmData, vmStr: VmData, vmReplacement: VmData, flags?: VmInt, index?: VmInt, limit?: VmInt): VmData {
  // TODO: Does nothing
  return new VmObject(new MetaString(vmStr.unpack()));
}

