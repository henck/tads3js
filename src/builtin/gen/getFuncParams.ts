import { VmData, VmList, VmTrue, VmNil, VmInt } from "../../types";
import { Vm } from "../../Vm";

export function builtin_getFuncParams(vmData: VmData): VmData {
  let funcinfo = Vm.getInstance().getFuncInfo(vmData.value);
  return new VmList([
    new VmInt(funcinfo.params),
    new VmInt(funcinfo.optParams),
    funcinfo.varargs ? new VmTrue() : new VmNil()
  ]);
}

