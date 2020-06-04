import { VmSstring } from "../../types";

export function builtin_t3GetVMBanner(): VmSstring {
  throw('INTERRUPT');
  return new VmSstring('tads3js 3.0.0');
}

