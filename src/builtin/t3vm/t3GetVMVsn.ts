import { VmInt } from "../../types";

export function builtin_t3GetVMVsn(): VmInt {
  // Major version = 3
  // Minor version = 0
  // Patch release number = 0
  return new VmInt(0x0300);
}

