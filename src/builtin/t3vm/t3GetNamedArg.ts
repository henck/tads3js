import { VmData, VmNil } from "../../types";
import { Vm } from "../../Vm";


export function builtin_t3GetNamedArg(vmName: VmData, vmDefVal?: VmData): VmData {
  // Get name of named argument to find:
  let name = vmName.unpack();
  // Get named arguments by walking stack:
  let variables = Vm.getInstance().getNamedArgs();
  // Find the index of named argument with specified name:
  let idx = variables.findIndex((v) => v.name == name);
  // If not found, use default value if any:
  if(idx == -1) {
    if(!vmDefVal) throw('Undefined named argument.');
    return vmDefVal;
  }
  // Return the named argument's value as found on the stack.
  return variables[idx].value;
}

