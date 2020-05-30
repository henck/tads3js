import { VmData, VmObject, VmNil } from "../../types";
import { MetaString } from "../../metaimp";

/**
 * Returns a string with the concatenation of the argument values, in the order given. 
 * @param args Values to concatenate
 * @returns Concatenated string
 */
export function builtin_concat(...args: VmData[]): VmData {
  return new VmObject(new MetaString(args.map((x) => x instanceof(VmNil) ? '' : x.toStr()).join('')));
}

