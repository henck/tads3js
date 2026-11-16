import { VmData, VmInt, VmNil, VmObject, VmSstring, VmFuncPtr } from "../../types";
import { MetaString, RexPattern, AnonFunc } from "../../metaimp";
import { Vm } from "../../Vm";
import { Match } from "../../regexp/TadsRegex";

const ReplaceAll        = 0x01;
const ReplaceIgnoreCase = 0x02;
const ReplaceFollowCase = 0x04;
const ReplaceSerial     = 0x08;
const ReplaceOnce       = 0x10;

/**
 * Replaces one or more matches for the regular expression pattern pat within the subject string
 * str, starting at the character index given by index. replacement is a string giving the replacement
 * text, or a function (regular or anonymous) to be invoked for each match to compute the replacement text.
 * pat and replacement may also be lists (see String.findReplace for the parallel and serial modes).
 * @param vmPat Pattern or list of patterns to match
 * @param vmStr String to search
 * @param vmReplacement Replacement or list of replacements
 * @param vmFlags Flags (ReplaceAll, ReplaceOnce, ReplaceIgnoreCase, ReplaceFollowCase, ReplaceSerial)
 * @param vmIndex Index to start at
 * @param vmLimit Max number of replacements to do (nil for no limit)
 * @returns String with replacements performed
 */
export function builtin_rexReplace(vmPat: VmData, vmStr: VmData, vmReplacement: VmData, vmFlags?: VmInt, vmIndex?: VmInt, vmLimit?: VmInt): VmData {
  let str: string = vmStr.unpack();

  // Read index and convert to 0-based.
  let index = vmIndex ? vmIndex.unpack() : 1;
  index = index <= 0 ? str.length + index : index - 1;

  // Parse flags. For compatibility, 0 means ReplaceOnce. Otherwise
  // ReplaceAll is the default, unless only ReplaceOnce is given.
  let flags = (vmFlags instanceof VmInt) ? vmFlags.unpack() : ReplaceAll;
  const isOnce = flags == 0 || ((flags & ReplaceOnce) != 0 && (flags & ReplaceAll) == 0);
  const isIgnoreCase = (flags & ReplaceIgnoreCase) != 0;
  const isFollowCase = (flags & ReplaceFollowCase) != 0;
  const isSerial = (flags & ReplaceSerial) != 0;

  let patterns: RexPattern[] = toRexPatternList(vmPat);
  if(isIgnoreCase) patterns = patterns.map((p) => p.withIgnoreCase());

  // An explicit limit overrides ReplaceOnce/ReplaceAll; nil means no limit.
  let limit: number = isOnce ? 1 : Number.MAX_VALUE;
  if(vmLimit instanceof VmNil) limit = Number.MAX_VALUE;
  if(vmLimit instanceof VmInt) limit = vmLimit.unpack();

  // Replace matches of the given patterns (each with the replacement at the
  // same index), always taking the leftmost match, up to 'max' times.
  // Returns the number of replacements made.
  let replace = (pats: { pat: RexPattern, idx: number }[], max: number): number => {
    let pos = index;
    let count = 0;
    // How much earlier replacements have shifted the text, so callbacks
    // get positions in the string as it was before this pass.
    let shift = 0;
    let before = str;
    while(pos <= str.length && count < max) {
      // Run every pattern against the string at the current position.
      let match: Match = null;
      let best: { pat: RexPattern, idx: number } = null;
      for(let p of pats) {
        let m: Match = p.pat.getRegExp().exec(str, pos);
        if(m == null) continue;
        // Keep the leftmost match (earlier patterns win ties).
        if(match == null || m.index < match.index) {
          best = p;
          match = m;
        }
      }
      if(match == null) break;

      // Set rexGroup register for the match we are processing.
      Vm.getInstance().match = match;
      let replStr = getReplacement(before, match.index - shift, best.idx, best.pat.isLiteral, match, vmReplacement);
      if(isFollowCase) replStr = followCase(match.value, replStr);
      str = str.substr(0, match.index) + replStr + str.substr(match.index + match.length);
      pos = match.index + replStr.length;
      shift += replStr.length - match.length;
      // After an empty match, move on so we don't match there again.
      if(match.length == 0) pos++;
      count++;
    }
    return count;
  };

  let indexed = patterns.map((p, i) => ({ pat: p, idx: i }));
  if(!isSerial) {
    // Parallel mode: search for all patterns at once.
    replace(indexed, limit);
  } else {
    // Serial mode: replace each pattern in turn in the updated string.
    for(let p of indexed) {
      let n = replace([p], limit);
      if(isOnce && n > 0) break;
    }
  }

  return new VmSstring(str);
}

/**
 * ReplaceFollowCase: if the match is all capitals, capitalize the whole
 * replacement; if it's all lower case, leave it; if mixed, capitalize the
 * first lower-case letter of the replacement.
 */
function followCase(matched: string, repl: string): string {
  let letters = Array.from(matched).filter((c) => c.toLowerCase() != c.toUpperCase());
  if(letters.length == 0) return repl;
  let upper = letters.every((c) => c == c.toUpperCase());
  let lower = letters.every((c) => c == c.toLowerCase());
  if(upper) return repl.toUpperCase();
  if(lower) return repl;
  let chars = Array.from(repl);
  let i = chars.findIndex((c) => c == c.toLowerCase() && c != c.toUpperCase());
  if(i >= 0) chars[i] = chars[i].toUpperCase();
  return chars.join('');
}

function isFunction(vm: VmData): boolean {
  return vm instanceof VmFuncPtr || (vm instanceof VmObject && vm.getInstance() instanceof AnonFunc);
}

function getReplacement(original: string, origIndex: number, patIndex: number, isLiteral: boolean, match: Match, vmReplacement: VmData): string {
  // Case: replacement is a function pointer (ordinary or anonymous).
  // It's called as func(match, index, originalString), with only as many
  // arguments as it takes. A nil result is an empty string.
  if(isFunction(vmReplacement)) {
    let params = vmReplacement.funcinfo().params;
    let args = [new VmSstring(match.value), new VmInt(origIndex + 1), new VmSstring(original)];
    let res = vmReplacement.invoke(...args.slice(0, params));
    return res instanceof VmNil ? '' : res.toStr();
  }

  let replacements = vmReplacement.unpack();

  // Case: replacements is a list: use the element for this pattern, or
  // an empty string if there are too few.
  if(Array.isArray(replacements)) {
    if(patIndex >= replacements.length) return '';
    // Each element of the array can be a string or a function.
    return getReplacement(original, origIndex, 0, isLiteral, match, replacements[patIndex]);
  }

  // Case: replacements is a simple string. For a regular expression,
  // %* is the whole match, %1..%9 the groups, and %% a percent sign.
  if(typeof(replacements) == 'string') {
    if(isLiteral) return replacements;
    return replacements.replace(/%([*%1-9])/g, (m: string, c: string) => {
      if(c == '*') return match.value;
      if(c == '%') return '%';
      let g = match.groups[parseInt(c)];
      return g && g.value != null ? g.value : '';
    });
  }

  // Any other case is not supported.
  return '';
}

function toRexPatternList(vmData: VmData): RexPattern[] {
  // A single pattern, or a list of patterns.
  let arr: VmData[] = Array.isArray(vmData.unpack()) ? vmData.unpack() : [vmData];

  // Turn each element into a RexPattern.
  return arr
    .map((a) => a.unpack())
    .map((p: any) => typeof(p) == 'string' ? new RexPattern(new VmSstring(p)) : p);
}
