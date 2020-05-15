import { Metaclass } from "./metaclass/Metaclass";
import { VmObject } from "./types";

export class Heap {
  private static objects: Map<number, Metaclass> = new Map<number, Metaclass>([]);

  static clear() {
    Heap.objects.clear();
  }

  static getObj(objID: number): Metaclass {
    return Heap.objects.get(objID);
  }

  static setObj(objID: number, obj: Metaclass) {
    Heap.objects.set(objID, obj);
  }

  /*
   * Add an object to the Heap, then return the key
   * that was attributed to it.
   */
  static addObj(obj: Metaclass): number {
    // Determine max key that exists in objects map:
    let maxkey = 0;
    Heap.objects.forEach((obj: Metaclass, key: number) => {
      if(key > maxkey) maxkey = key;
    });
    let key = maxkey + 1;
    // Add the new object with a key above the max key:
    Heap.objects.set(key, obj);
    return key;
  }
}