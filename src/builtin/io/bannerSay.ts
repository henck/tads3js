import { VmData, VmInt } from "../../types";
import { Vm } from "../../Vm";

export function builtin_bannerSay(vmHandle: VmInt, ...args: VmData[]): VmData {
  args.forEach((a) => Vm.getInstance().output('BANNERSAY', a.toStr()));
  // TODO say to banner
  return null;
}

