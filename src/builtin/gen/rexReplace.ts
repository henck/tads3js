import { VmData, VmInt, VmNil, VmObject, VmSstring, VmTrue, VmFuncPtr } from "../../types";
import { MetaString, RexPattern, AnonFunc } from "../../metaimp";
import { Vm } from "../../Vm";
import { Match } from "../../regexp/RegExpPlus";

const ReplaceAll        = 0x01;
const ReplaceIgnoreCase = 0x02;
const ReplaceFollowCase = 0x04;
const ReplaceSerial     = 0x08;
const ReplaceOnce       = 0x10;

/**
 * Replaces one or more matches for the regular expression pattern pat within the subject string 
 * str, starting at the character index given by index. replacement is a string giving the replacement 
 * text, or a function (regular or anonymous) to be invoked for each match to compute the replacement text. 
 * @param vmPat Pattern or list of patterns to match
 * @param vmStr String to search
 * @param vmReplacement Replacement or list of replacements
 * @param vmFlags Flags
 * @param vmIndex Index to start at
 * @param vmLimit Max number of replacements to do
 * @returns String with replacements performed
 * @todo Support serial replacement
 * @todo Support ReplaceIgnoreCase
 * @todo Support ReplaceFollowCase
 */
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
  
  if(isFollowCase) throw('rexReplace: No ReplaceFollowCase support');
  if(isIgnoreCase) throw('rexReplace: No ReplaceIgnoreCase support');

  // By default, there is no limit.
  let limit: number = Number.MAX_VALUE;
  // ReplaceOnce sets limit to 1.
  if(!isAll) limit = 1;
  // If limit specified, use it and ignore ReplaceOnce/ReplaceAll flags:
  if(vmLimit && vmLimit instanceof VmNil) limit = Number.MAX_VALUE;
  if(vmLimit && vmLimit instanceof VmInt) limit = vmLimit.unpack();

  if(!isSerial) {
    // Search at every position in the string (starting at index), 
    // left to right:
    let pos = index;
    let count = 0;
    while(pos < str.length && count < limit) {
      // Run every pattern against the string at the current position.
      let match: Match = null;
      let patIndex: number = 0;
      for(let i = 0; i < patterns.length; i++) {
        let m: Match = patterns[i].getRegExp().exec(str, pos);
        if(m == null) continue;
        // Save match if it has a lower position than the current match.
        if(match == null || m.index < match.index) {
          patIndex = i;
          match = m;
        }
      }
      // No match? Then quit.
      if(match == null) break;

      // Set rexGroup register for the match we are processing.
      Vm.getInstance().match = match;
      let replace_str = getReplacement(str, patIndex, match, vmReplacement);
      let left = str.substr(0, match.index);
      let right = str.substr(match.index + match.length);
      str = left + replace_str + right;
      pos = match.index + replace_str.length;
      count++;
    }
  }

  // Serial mode
  else {
    throw('rexReplace serial mode not supported.');
  }
  
  return new VmObject(new MetaString(str));
}

function getReplacement(str: string, patIndex: number, match: Match, vmReplacement: VmData): string {
  let replacements = vmReplacement.unpack();

  // Case: replacement is a function pointer:
  if(vmReplacement instanceof VmFuncPtr) {
    // For a Funcptr, we must check the number of arguments that the function
    // actually expects and send no more than that:
    let params = Vm.getInstance().getFuncInfo(vmReplacement.value).params;
    let args = [];
    if(params >= 1) args.push(new VmSstring(match.value));
    if(params >= 2) args.push(new VmInt(match.index));
    if(params >= 3) args.push(new VmSstring(str));
    return vmReplacement.invoke(...args).unpack();
  }
  
  // Case: replacement is an anonymous fuunction
  if(vmReplacement instanceof VmObject && vmReplacement.getInstance() instanceof AnonFunc) {
    // For an AnonFunc, we do not need to check the number
    // of arguments.
    return vmReplacement.invoke(new VmSstring(match.value), new VmInt(match.index), new VmSstring(str)).unpack();
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
    replacements = replacements.replace('%*', match.value);
    replacements = replacements.replace(/%(\d+)/g, (m:any, p1:any) => match.groups[parseInt(p1)].value );
    return replacements;
  }

  // Any other case is not supported.
  return '';
}

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

