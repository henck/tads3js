import { VmData, VmInt, VmNil } from "../../types";

export function builtin_rexMatch(vmPat: VmData, vmStr: VmData, index?: VmInt): VmData {
  // TODO: Does nothing
  return new VmNil();
}

