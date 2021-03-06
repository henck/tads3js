import { VmData } from "../../types";

/**
 * Returns the least argument value
 * @param args Arguments to compare
 * @returns Greatest value
 * @throws Error if values are not comparable, or if there are no values.
 */
export function builtin_min(...args: VmData[]): VmData {
  if(args.length == 0) throw('No values.');
  return args.reduce((x: VmData, y: VmData) => x.lt(y) ? x : y, args[0]);
}

