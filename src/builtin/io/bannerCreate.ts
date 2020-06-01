import { VmData, VmInt } from "../../types";

export function builtin_bannerCreate(
    vmParent: VmInt, vmWhere: VmInt, vmOther: VmInt, 
    vmWindowType: VmInt, vmAlign: VmInt, vmSize: VmInt, vmSizeUnits: VmInt, vmStyle: VmInt): VmData 
{
  return new VmInt(0);
}

