import { VmData } from "../types";

/**
 * Display one or more values
 * @param args Values to display
 * @todo: Bignumber support
 */
export function builtin_tadsSay(...args: VmData[]): VmData {
  args.forEach((a) => console.log(a.toStr()));
  return null;
}

