import { VmInt, VmData, VmObject } from "../types";
import { List } from "../metaimp";

/**
 * Constructs a list by repeating the given value the given number of times. 
 * @param vmVal Value to repeat
 * @param vmCount Optional. 1 if not given.
 * @returns New List
 */

export function builtin_makeList(vmVal: VmData, vmCount?: VmInt): VmData {
  let count = vmCount ? vmCount.unpack() : 1;
  if(count < 0) throw('makeList: No negative count allowed.');
  let arr = [];
  for(let i = 0; i < count; i++) arr.push(vmVal);
  // TODO: The values should be cloned so they are all different instances.
  return new VmObject(new List(arr));
}

