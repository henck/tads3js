import { VmData } from "../../types";
import { Debug } from "../../Debug";
import { Vm } from "../../Vm";

/**
 * Display one or more values
 * @param args Values to display
 * @todo: Bignumber support
 */
export function builtin_tadsSay(...args: VmData[]): VmData {
  args.forEach((a) => Vm.getInstance().output('TADSSAY', a.toStr()));
  return null;
}

