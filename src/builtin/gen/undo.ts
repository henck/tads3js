import { VmData, VmNil, VmTrue } from "../../types";
import { Undo } from "../../Undo";

/** savepoint(): establish an undo savepoint. */
export function builtin_savepoint(): VmData {
  Undo.savepoint();
  return new VmNil();
}

/** undo(): undo changes back to the most recent savepoint; nil if there's none. */
export function builtin_undo(): VmData {
  return Undo.undo() ? new VmTrue() : new VmNil();
}
