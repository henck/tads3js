import { Heap } from "./Heap";
import { Platform } from "./Platform";
import { RootObject } from "./metaclass/RootObject";
import { VmData, VmObject } from "./types";
import { VmMap } from "./metaimp/VmMap";

/** A native call in progress: what its JavaScript code may be holding. */
interface INativeCall {
  watermark: number;    // the next object ID when the call started
  target: RootObject;
  args: any[];
}

/**
 * The garbage collector: mark and sweep. Objects are reachable from the
 * roots: the objects loaded from the image (which are never collected),
 * the VM's stack and registers, undo information, and anything else the VM
 * holds (see Vm.gcRoots()).
 *
 * Native code (intrinsic methods and functions) can hold VM values in
 * JavaScript variables while it calls back into byte code, where a
 * collection can happen. So for each native call in progress we also keep
 * its target object and arguments, and every object created since the
 * outermost one started (object IDs only increase).
 */
export class Gc {
  /** Collect after this many new objects (TADS3JS_GC_THRESHOLD overrides, for testing). */
  static threshold = Number(Platform.get().setting('TADS3JS_GC_THRESHOLD')) || 50000;
  private static allocated = 0;
  private static natives: INativeCall[] = [];

  static reset() {
    Gc.allocated = 0;
    Gc.natives = [];
  }

  /** Called when an object is created. */
  static noteAllocation() {
    Gc.allocated++;
  }

  /** Is a collection due? */
  static due(): boolean {
    return Gc.allocated >= Gc.threshold;
  }

  /** Run native code (fn), keeping what it holds alive. */
  static native<T>(target: RootObject, args: any[], fn: () => T): T {
    Gc.natives.push({ watermark: Heap.peekNextID(), target: target, args: args });
    try {
      return fn();
    } finally {
      Gc.natives.pop();
    }
  }

  /**
   * Collect garbage.
   * @param roots Values and objects the VM holds
   * @param staticIDs Objects loaded from the image
   * @returns The number of objects collected
   */
  static collect(roots: any[], staticIDs: number[]): number {
    Gc.allocated = 0;
    let marked = new Set<number>();
    let pending: number[] = [];
    let mark = (id: number) => {
      if(!marked.has(id) && Heap.getObj(id)) { marked.add(id); pending.push(id); }
    };
    let seen = new Set<any>();
    let walk = (v: any) => {
      if(v === null || typeof(v) != 'object') return;
      if(v instanceof VmObject) { if(typeof(v.value) == 'number') mark(v.value); return; }
      if(v instanceof RootObject) { mark(v.id); return; }
      if(v instanceof VmData) { walk(v.value); return; }
      if(seen.has(v)) return;
      if(Array.isArray(v)) { seen.add(v); v.forEach(walk); return; }
      if(v instanceof Map) { seen.add(v); v.forEach((x, k) => { walk(k); walk(x); }); return; }
      if(v instanceof VmMap) { seen.add(v); walk((v as any)._keys); walk((v as any)._values); return; }
      if(Object.getPrototypeOf(v) === Object.prototype) {
        seen.add(v);
        for(let k of Object.keys(v)) walk(v[k]);
        // (An undo snapshot of a TadsObject has its superclasses as IDs.)
        if(Array.isArray(v.superClasses)) v.superClasses.forEach((id: any) => { if(typeof(id) == 'number') mark(id); });
      }
    };

    staticIDs.forEach(mark);
    roots.forEach(walk);
    if(Gc.natives.length) {
      let low = Gc.natives[0].watermark;
      Heap.forEach((id) => { if(id >= low) mark(id); });
      for(let n of Gc.natives) { if(n.target) mark(n.target.id); walk(n.args); }
    }

    // Mark everything reachable.
    while(pending.length) {
      let obj = Heap.getObj(pending.pop());
      seen.clear();
      for(let key of Object.keys(obj)) walk((obj as any)[key]);
      obj.gcRefs(mark);
    }

    // Sweep.
    let doomed: number[] = [];
    Heap.forEach((id) => { if(!marked.has(id)) doomed.push(id); });
    doomed.forEach((id) => Heap.deleteObj(id));
    return doomed.length;
  }
}
