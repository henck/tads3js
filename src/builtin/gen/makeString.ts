import { VmInt, VmData, VmObject } from "../../types";
import { MetaString } from "../../metaimp";

/**
 * Constructs a string by repeating the given value the given number of times.
 * @param vmVal string, listlike, integer
 * @param vmCount Optional. 1 if not given.
 * @returns String
 * @throws Error if count < 0 or if vmVal is an unsupported type
 */

export function builtin_makeString(vmVal: VmData, vmCount?: VmInt): VmData {
  let count = vmCount ? vmCount.unpack() : 1;
  if(count < 0) throw('makeString: No negative count allowed.');

  // Create substring to repeat:
  let val = vmVal.unpack();
  let substring = '';
  if(typeof(val) == 'string') {
    substring = val;
  }
  else if(typeof(val) == 'number') {
    substring = String.fromCharCode(val);
  }
  else if(Array.isArray(val)) {
    // An array must contain integers.
    substring = String.fromCharCode(...val.map((x) => x.unpack()));
  }
  else {
    throw('makeString: Disallowed type');
  }

  return new VmObject(new MetaString(new Array(count).fill(substring, 0, count).join('')));
}

