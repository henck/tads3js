import { VmData, VmInt, VmNil } from "../../types";

export function builtin_bannerSetSize(vmHandle: VmInt, vmSize: VmInt, VmSizeUnits: VmInt, VmIsAdvisory: VmData): VmData {
  return new VmNil();
}
