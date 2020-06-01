import { VmData, VmObject } from "../../types";
import { Vm } from "../../Vm";
import { List } from "../../metaimp";

/**
 * Retrieves a list of the names of all of the named arguments currently in effect. 
 * If no named arguments are in effect, returns an empty list. 
 * @returns List of names
 */
export function builtin_t3GetNamedArgList(): VmData {
  // Get named arguments by walking stack:
  let names = Vm.getInstance().getNamedArgs().map((v) => v.name);
  return new VmObject(new List(names));
}

