import { RootObject } from "./metaclass/RootObject";
import { Heap } from "./Heap";

interface ISavepoint {
  states: Map<RootObject, any>;   // objects changed since the savepoint, and their state then
  firstID: number;                // objects with this ID or higher are newer than the savepoint
}

/**
 * The undo mechanism. Changes are recorded per savepoint: the first time a
 * persistent object changes after a savepoint, a snapshot of its state is
 * kept (rather than one record per change, as the reference VM does), and
 * undo() restores those snapshots. The reference VM keeps the 64 most
 * recent savepoints.
 *
 * Objects created after a savepoint aren't destroyed by undo (as in the
 * reference VM, they're simply left unreferenced), and changes to them
 * aren't undone either.
 */
export class Undo {
  static readonly MAX_SAVEPOINTS = 64;
  private static savepoints: ISavepoint[] = [];

  /** For the garbage collector: the objects and values undo information refers to. */
  static gcRoots(): any[] {
    return Undo.savepoints.map((sp) => sp.states);
  }

  static clear() {
    Undo.savepoints = [];
  }

  static savepoint() {
    Undo.savepoints.push({ states: new Map(), firstID: Heap.peekNextID() });
    if(Undo.savepoints.length > Undo.MAX_SAVEPOINTS) Undo.savepoints.shift();
  }

  /** Called before an object changes. */
  static record(obj: RootObject) {
    let n = Undo.savepoints.length;
    if(n == 0 || obj.isTransientObj()) return;
    let sp = Undo.savepoints[n - 1];
    // (Changes to objects created since the savepoint aren't undone.)
    if(obj.id >= sp.firstID) return;
    if(!sp.states.has(obj)) sp.states.set(obj, obj.saveState());
  }

  /** Undo to the most recent savepoint; false if there is none. */
  static undo(): boolean {
    let sp = Undo.savepoints.pop();
    if(!sp) return false;
    sp.states.forEach((state, obj) => obj.restoreState(state));
    return true;
  }
}
