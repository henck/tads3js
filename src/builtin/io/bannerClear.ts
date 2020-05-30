import { VmData, VmInt, VmNil } from "../../types";

export function builtin_bannerClear(vmHandle: VmInt): VmData {
  return new VmNil();
}
