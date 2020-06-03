import { VmData, VmInt, VmNil, VmObject, VmSstring, VmTrue, VmFuncPtr } from "../../types";
import { MetaString, RexPattern, AnonFunc } from "../../metaimp";
import { Vm } from "../../Vm";

const ReplaceAll        = 0x01;
const ReplaceIgnoreCase = 0x02;
const ReplaceFollowCase = 0x04;
const ReplaceSerial     = 0x08;
const ReplaceOnce       = 0x10;

function toRexPatternList(vmData: VmData): RexPattern[] {
  let patterns: RexPattern[] = [];

  // Test is argument is a packed array. If not,
  // treat argument as array of one element.
  // Result: We have an array of VmData.
  let arr: VmData[];
  if(!Array.isArray(vmData.unpack())) {
    arr = [vmData];
  } 
  // Otherwise, unpack array.
  else {
    arr = vmData.unpack();
  }

  // Unpack all array elements, then turn each element into a RexPattern.
  patterns = arr
    .map((a) => a.unpack())
    .map((p: any) => typeof(p) == 'string' ? new RexPattern(new VmSstring(p)) : p);
  return patterns;
}

export function builtin_rexReplace(vmPat: VmData, vmStr: VmData, vmReplacement: VmData, vmFlags?: VmInt, vmIndex?: VmInt, vmLimit?: VmInt): VmData {
  let patterns: RexPattern[] = toRexPatternList(vmPat);
  let str: string = vmStr.unpack();

  // Read index and convert to 0-based.
  let index = vmIndex ? vmIndex.unpack() : 1;
  index = index <= 0 ? str.length + index : index - 1;

  // Parse flags:
  let flags = vmFlags ? vmFlags.unpack() : ReplaceAll;
  const isAll = (flags & ReplaceAll);
  const isIgnoreCase = (flags & ReplaceIgnoreCase);
  const isFollowCase = (flags & ReplaceFollowCase);
  const isSerial = (flags & ReplaceSerial);  

  // By default, there is no limit.
  let limit: number = 999;
  // ReplaceOnce sets limit to 1.
  if(!isAll) limit = 1;
  // If limit specified, use it:
  if(vmLimit && vmLimit instanceof VmNil) limit = 999;
  if(vmLimit && vmLimit instanceof VmInt) limit = vmLimit.unpack();

  if(!isSerial) {
    // Search at every position in the string (starting at index), 
    // left to right:
    let pos = index;
    let count = 0;
    while(pos < str.length && count < limit) {
      // Run every pattern against the string at the current position.
      let match: any = null;
      let patIndex: number = 0;
      for(let i = 0; i < patterns.length; i++) {
        let m: any = patterns[i].getRegExp().exec(str, pos);
        if(m == null) continue;
        // Save match if it has a lower position than the current match.
        if(match == null || m.index[0] < match.index[0]) {
          patIndex = i;
          match = m;
        }
      }
      // No match? Then quit.
      if(match == null) break;

      let replace_str = getReplacement(str, patIndex, match, vmReplacement);
      let left = str.substr(0, match.index[0]);
      let right = str.substr(match.index[0] + match[0].length);
      str = left + replace_str + right;
      pos = match.index[0] + replace_str.length;
      count++;
    }
  }

  // Serial mode
  else {
    throw('rexReplace serial mode not supported.');
  }
  
  return new VmObject(new MetaString(str));
}

function getReplacement(str: string, patIndex: number, match: any, vmReplacement: VmData): string {
  let replacements = vmReplacement.unpack();

  // Case: replacement is a function pointer:
  if(vmReplacement instanceof VmFuncPtr) {
    // For a Funcptr, we must check the number of arguments that the function
    // actually expects and send no more than that:
    let params = Vm.getInstance().getFuncInfo(vmReplacement.value).params;
    let args = [];
    if(params >= 1) args.push(new VmSstring(match[0]));
    if(params >= 2) args.push(new VmInt(match.index[0]));
    if(params >= 3) args.push(new VmSstring(str));
    return vmReplacement.invoke(...args).unpack();
  }
  
  // Case: replacement is an anonymous fuunction
  if(vmReplacement instanceof VmObject && vmReplacement.getInstance() instanceof AnonFunc) {
    // For an AnonFunc, we do not need to check the number
    // of arguments.
    return vmReplacement.invoke(new VmSstring(match[0]), new VmInt(match.index[0]), new VmSstring(str)).unpack();
  }

  // Case: replacements is an array.
  if(Array.isArray(replacements)) {
    // If we run out of replacements, return the empty string.
    if(patIndex >= replacements.length) {
      return '';
    } else {
      // Each element of the array can be a string or a function, so
      // we call getReplacement again.
      return getReplacement(str, patIndex, match, replacements[patIndex]);
    }
  } 

  // Case: replacements is a simple string
  if(typeof(replacements) == 'string') {
    // Perform replacements for %* and %1...%n:
    replacements = replacements.replace('%*', match[0]);
    replacements = replacements.replace(/%(\d+)/g, (m:any, p1:any) => match[parseInt(p1)] );
    return replacements;
  }

  // Any other case is not supported.
  return '';
}

