import { VmData, VmNil, VmTrue, VmProp, VmFuncPtr, VmEnum, VmBifPtr } from "../../types";
import { Vm } from "../../Vm";
import { VmRuntimeError, VmErr } from "../../VmErrors";

/**
 * The text tadsSay() displays for its arguments: strings, numbers, lists
 * and string-like objects. nil displays nothing; true, property and
 * function pointers etc. are "invalid type for intrinsic function
 * argument" (2304).
 */
export function sayText(args: VmData[]): string {
  let text = '';
  for(let a of args) {
    if(a instanceof VmNil) continue;
    if(a instanceof VmTrue || a instanceof VmProp || a instanceof VmFuncPtr || a instanceof VmEnum || a instanceof VmBifPtr)
      throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
    text += a.toStr();
  }
  return text;
}

/** tadsSay(val, ...): display values in the main window. */
export function builtin_tadsSay(...args: VmData[]): VmData {
  Vm.getInstance().console.say(sayText(args));
  return new VmNil();
}
