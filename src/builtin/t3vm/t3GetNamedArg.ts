import { VmData, VmNil } from "../../types";
import { Vm } from "../../Vm";


export function builtin_t3GetNamedArg(vmName: VmData, vmDefVal?: VmData): VmData {
  let name = vmName.unpack();
  let names = Vm.getInstance().getNamedArgs();
  let idx = names.indexOf(name);
  if(idx == -1) {
    if(!vmDefVal) throw('Undefined named argument.');
    return vmDefVal;
  }
  let stack = Vm.getInstance().stack;
  //console.log("idx", idx);
  //console.log("argcount", stack.getArgCount());
  let value = stack.getArg(stack.getArgCount() + names.length - idx - 1);
  
  //console.log("Arg found", name, value);
  return value;
}

