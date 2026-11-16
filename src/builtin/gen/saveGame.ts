import { VmData, VmNil } from "../../types";
import { Persist } from "../../Persist";
import { Vm } from "../../Vm";

/** saveGame(filename, metaTable?): save the state of all persistent objects. */
export function builtin_saveGame(vmFile: VmData, vmMeta?: VmData): VmData {
  Persist.save(Vm.getInstance().program(), vmFile, vmMeta);
  return new VmNil();
}

/** restoreGame(filename): restore the state saved by saveGame(). */
export function builtin_restoreGame(vmFile: VmData): VmData {
  Persist.restore(Vm.getInstance().program(), vmFile);
  return new VmNil();
}

/** restartGame(): reset all persistent objects to their initial state. */
export function builtin_restartGame(): VmData {
  Persist.restart(Vm.getInstance().program());
  return new VmNil();
}
