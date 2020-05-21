import { VmData, VmNil } from "../types";

/**
 * Initialize the random number generator (RNG). 
 * @param args Values to concatenate
 * @returns nil
 */
export function builtin_randomize(...args: VmData[]): VmNil {
  // This function does nothing.
  return new VmNil();
}

