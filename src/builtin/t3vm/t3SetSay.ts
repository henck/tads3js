import { VmData, VmFuncPtr, VmNil, VmObject } from "../../types";
import { Vm } from "../../Vm";
import { AnonFunc } from "../../metaimp";

export function builtin_t3SetSay(val: VmData): VmData {
  if(val instanceof VmFuncPtr || (val instanceof VmObject && val.getInstance() instanceof AnonFunc)) {
    let old = Vm.getInstance().outputFunc;
    Vm.getInstance().outputFunc = val;
    return old;
  } else {
    throw('T3SetSay: TODO - Unsupported argument.');
  }
}

