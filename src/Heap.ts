import { RootObject } from "./metaclass/RootObject";

export class Heap {
  private static objects: Map<number, RootObject> = new Map<number, RootObject>([]);

  static clear() {
    Heap.objects.clear();
  }

  static getObj(objID: number): RootObject {
    return Heap.objects.get(objID);
  }

  static setObj(objID: number, obj: RootObject) {
    obj.setID(objID);
    Heap.objects.set(objID, obj);
  }

  /*
   * Add an object to the Heap, then return the key
   * that was attributed to it.
   */
  static addObj(obj: RootObject): number {
    // Determine max key that exists in objects map:
    let maxkey = 0;
    Heap.objects.forEach((obj: RootObject, key: number) => {
      if(key > maxkey) maxkey = key;
    });
    let key = maxkey + 1;
    // Add the new object with a key above the max key:
    Heap.objects.set(key, obj);
    return key;
  }
}