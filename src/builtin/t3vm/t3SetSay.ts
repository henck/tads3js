import { VmData, VmFuncPtr, VmNil, VmObject, VmProp, VmInt } from "../../types";
import { Vm } from "../../Vm";
import { VmRuntimeError, VmErr } from "../../VmErrors";

const T3SetSayNoFunc = 1;
const T3SetSayNoMethod = 2;

/**
 * t3SetSay(val): set the default display function (a function pointer or
 * anonymous function) or method (a property pointer); T3SetSayNoFunc and
 * T3SetSayNoMethod remove them. Returns the previous function or method
 * (or T3SetSayNoFunc/T3SetSayNoMethod if there was none).
 */
export function builtin_t3SetSay(val: VmData): VmData {
  let vm = Vm.getInstance();
  if(val instanceof VmProp || (val instanceof VmInt && val.value == T3SetSayNoMethod)) {
    let old = vm.outputMethod;
    vm.outputMethod = val instanceof VmProp ? val : new VmNil();
    return old instanceof VmNil ? new VmInt(T3SetSayNoMethod) : old;
  }
  if(val instanceof VmFuncPtr || val instanceof VmObject || val instanceof VmNil
     || (val instanceof VmInt && val.value == T3SetSayNoFunc)) {
    let old = vm.outputFunc;
    vm.outputFunc = val instanceof VmFuncPtr || val instanceof VmObject ? val : new VmNil();
    return old instanceof VmNil ? new VmInt(T3SetSayNoFunc) : old;
  }
  throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
}
