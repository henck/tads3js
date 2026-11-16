import { RootObject } from "./metaclass/RootObject";
import { IntrinsicClass } from "./metaimp";
import { Gc } from "./Gc";

export class Heap {
  private static objects: Map<number, RootObject> = new Map<number, RootObject>([]);

  private static nextID = 1;
  // The IDs of all objects, in ascending order (null when it needs rebuilding).
  private static sorted: number[] = [];

  static clear() {
    Heap.objects.clear();
    Heap.nextID = 1;
    Heap.sorted = [];
  }

  static getObj(objID: number): RootObject {
    return Heap.objects.get(objID);
  }

  static deleteObj(objID: number) {
    Heap.objects.delete(objID);
    Heap.sorted = null;
  }

  /** Give an object a specific ID (e.g. when loading it from the image). */
  static setObj(objID: number, obj: RootObject) {
    Heap.sorted = null;
    // Remove the provisional entry the object got when it was constructed.
    if(obj.id !== undefined && obj.id != objID && Heap.objects.get(obj.id) === obj) Heap.objects.delete(obj.id);
    obj.setID(objID);
    Heap.objects.set(objID, obj);
    if(objID >= Heap.nextID) Heap.nextID = objID + 1;
  }

  static forEach(callback: (id: number, value: RootObject, isIntrinsic: boolean) => void) {
    for(let key of Heap.objects.keys()) {
      let obj = Heap.getObj(key);
      callback(key, obj, obj instanceof IntrinsicClass);
    }
  }

  /**
   * Find the first object after fromKey (or the first object of all, if
   * fromKey is null), in order of object ID, that satisfies the comparator.
   */
  /** The IDs of all objects, in ascending order. */
  static sortedIDs(): number[] {
    if(!Heap.sorted) Heap.sorted = Array.from(Heap.objects.keys()).sort((a, b) => a - b);
    return Heap.sorted;
  }

  /** The index of the first element of a sorted array greater than value. */
  static indexAfter(ids: number[], value: number): number {
    let lo = 0, hi = ids.length;
    while(lo < hi) {
      let mid = (lo + hi) >> 1;
      if(ids[mid] <= value) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  static findFromKey(fromKey: number, comparator: (id: number, value: RootObject, isIntrinsic: boolean) => boolean): {key: number, obj: RootObject} {
    let ids = Heap.sortedIDs();
    let lo = fromKey === null ? 0 : Heap.indexAfter(ids, fromKey);
    for(let i = lo; i < ids.length; i++) {
      let obj = Heap.objects.get(ids[i]);
      if(obj && comparator(ids[i], obj, obj instanceof IntrinsicClass)) return { key: ids[i], obj: obj };
    }
    return null;
  }

  static find(comparator: (id: number, value: RootObject, isIntrinsic: boolean) => boolean): { key: number, obj: RootObject} {
    return Heap.findFromKey(null, comparator);
  }
  
  private static getNewKey(): number {
    // IDs aren't reused, so a stale reference can never find another object.
    while(Heap.objects.has(Heap.nextID)) Heap.nextID++;
    return Heap.nextID++;
  }

  /*
   * Add an object to the Heap, then return the key
   * that was attributed to it.
   */
  /** The ID the next new object will get. */
  static peekNextID(): number {
    return Heap.nextID;
  }

  // While false, new objects aren't put on the heap (see unregistered()).
  private static registering = true;

  /**
   * Create objects (with fn) without putting them on the heap: temporary
   * objects that native code uses and drops, which are referred to directly
   * (VmObject.direct) rather than by ID. They get ID 0.
   */
  static unregistered<T>(fn: () => T): T {
    let was = Heap.registering;
    Heap.registering = false;
    try {
      return fn();
    } finally {
      Heap.registering = was;
    }
  }

  static addObj(obj: RootObject): number {
    if(!Heap.registering) return 0;
    Gc.noteAllocation();
    // New objects get IDs above all others, so they go at the end of the
    // sorted ID list.
    let newKey = Heap.getNewKey();
    obj.setID(newKey);
    Heap.objects.set(newKey, obj);
    if(Heap.sorted) Heap.sorted.push(newKey);
    return newKey;
  }
}