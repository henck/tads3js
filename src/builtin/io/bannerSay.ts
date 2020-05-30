import { VmData, VmInt } from "../../types";

export function builtin_bannerSay(vmHandle: VmInt, ...args: VmData[]): VmData {
  args.forEach((a) => console.log('OUTPUT', a.toStr()));
  // TODO say to banner
  return null;
}

