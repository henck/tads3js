import { VmData, VmInt, VmNil, VmSstring } from "../../types";
import { RexPattern } from "../../metaimp";
import { RegExpPlus } from "../../regexp/RegExpPlus";
import { Vm } from "../../Vm";

export function builtin_rexMatch(vmPat: VmData, vmStr: VmData, vmIndex?: VmInt): VmData {
  let pat = vmPat.unpack(); // rx is a string or a RexPattern instance
  // If a string was given, create a RexPattern.
  if(typeof(pat) == 'string') pat = new RexPattern(new VmSstring(pat));
  // rx is now a RexPattern instance

  // Read input string
  let str: string = vmStr.unpack();

  // Read index and convert to 0-based.
  let index = vmIndex ? vmIndex.unpack() : 1;
  index = index <= 0 ? str.length + index : index - 1;

  // Perform match:
  let m: any = (pat as RexPattern).getRegExp().exec(str, index);

  // If no match, or match does not start at specified index, return nil.
  if(m == null || m.index[0] != index) return new VmNil();
  
  return new VmInt(m[0].length);
}

