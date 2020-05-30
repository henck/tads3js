import { RootObject } from "./metaclass/RootObject";
import { IntrinsicClass } from "./metaimp";

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

  static forEach(callback: (id: number, value: RootObject, isIntrinsic: boolean) => void) {
    for(let key of Heap.objects.keys()) {
      let obj = Heap.getObj(key);
      callback(key, obj, obj instanceof IntrinsicClass);
    }
  }

  static findFromKey(fromKey: number, comparator: (id: number, value: RootObject, isIntrinsic: boolean) => boolean): {key: number, obj: RootObject} {
    let index = 0;
    let keyfound = fromKey == null;
    for(let key of Heap.objects.keys()) {
      if(keyfound) {
        let obj = Heap.getObj(key);
        if(comparator(key, obj, obj instanceof IntrinsicClass)) {
          return { key: key, obj: obj };
        }
      } else {
        keyfound = key == fromKey;
      }
      index++;
    }
    return null;
  }

  static find(comparator: (id: number, value: RootObject, isIntrinsic: boolean) => boolean): { key: number, obj: RootObject} {
    return Heap.findFromKey(null, comparator);
  }
  
  private static getNewKey(): number {
    // Determine max key that exists in objects map:
    let maxkey = 0;
    Heap.objects.forEach((obj: RootObject, key: number) => {
      if(key > maxkey) maxkey = key;
    });
    let key = maxkey + 1;
    return key;    
  }

  /*
   * Add an object to the Heap, then return the key
   * that was attributed to it.
   */
  static addObj(obj: RootObject): number {
    let newKey = Heap.getNewKey();
    // Add the new object with a key above the max key:
    Heap.setObj(newKey, obj);
    return newKey;
  }
}