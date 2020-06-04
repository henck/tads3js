import { VmData, VmNil, VmTrue } from "../../types";

export function builtin_inputLineCancel(vmReset: VmTrue|VmNil): VmData {
  return new VmNil();
}
