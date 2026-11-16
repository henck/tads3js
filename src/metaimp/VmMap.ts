import { VmData, VmNil, VmInt, VmSstring, VmTrue, VmProp, VmEnum, VmFuncPtr, VmObject } from "../types";

// The index is stored under a Symbol, so Object.keys() (and so undo
// snapshots, saving and the garbage collector) don't see it.
const INDEX = Symbol('index');

/** Keys that can't be hashed (compared by content): searched linearly. */
const UNHASHED = '?';

// Classes whose objects are compared by content (loaded when needed, as they depend on this module).
let byContent: any[] = null;
function comparedByContent(obj: any): boolean {
  if(!byContent) byContent = [require('./List').List, require('./Vector').Vector, require('./BigNumber').BigNumber];
  return byContent.some((c) => obj instanceof c);   // (AnonFunc is a Vector)
}

/**
 * The entries of a LookupTable, in insertion order, with a hash index for
 * finding keys. Keys are equal as with ==: integers, strings (constant or
 * String objects) and other simple values by value, objects by identity,
 * and lists and BigNumbers by content (those are searched linearly).
 */
class VmMap {
  private _keys: VmData[];
  private _values: VmData[];

  constructor(keys: VmData[], values: VmData[]) {
    this._keys = keys;
    this._values = values;
  }

  /** The hash of a key, or UNHASHED. */
  private static hash(key: VmData): string {
    if(key instanceof VmInt) return 'i' + key.value;
    if(key instanceof VmSstring) return 's' + key.value;
    if(key instanceof VmNil) return 'n';
    if(key instanceof VmTrue) return 't';
    if(key instanceof VmProp) return 'p' + key.value;
    if(key instanceof VmEnum) return 'e' + key.value;
    if(key instanceof VmFuncPtr) return 'f' + key.value;
    if(key instanceof VmObject) {
      let obj = key.getInstance();
      if(!obj) return 'o' + key.value;
      let v = obj.unpack();
      if(typeof(v) == 'string') return 's' + v;           // a String object
      if(comparedByContent(obj)) return UNHASHED;
      return 'o' + key.value;
    }
    return UNHASHED;
  }

  /** The index: hash -> positions in the arrays (built when needed). */
  private index(): Map<string, number[]> {
    let index: Map<string, number[]> = (this as any)[INDEX];
    if(!index) {
      index = new Map();
      this._keys.forEach((k, i) => {
        let h = VmMap.hash(k);
        let list = index.get(h);
        if(list) list.push(i); else index.set(h, [i]);
      });
      (this as any)[INDEX] = index;
    }
    return index;
  }

  public clone(): VmMap {
    return new VmMap(this._keys.slice(), this._values.slice());
  }

  public indexOf(key: VmData): number {
    let h = VmMap.hash(key);
    let candidates = this.index().get(h);
    if(candidates) {
      for(let i of candidates) if(h != UNHASHED || this._keys[i].eq(key)) return i;
    }
    // A list or BigNumber key might equal a key of another kind.
    if(h == UNHASHED) {
      for(let [hh, list] of this.index()) {
        if(hh == UNHASHED) continue;
        for(let i of list) if(this._keys[i].eq(key)) return i;
      }
    }
    return -1;
  }

  public set(key: VmData, value: VmData) {
    let index = this.indexOf(key);
    if(index >= 0) {
      this._keys[index] = key;
      this._values[index] = value;
    } else {
      this.append(key, value);
    }
  }

  /** Add an entry, without checking whether the key is already present. */
  public append(key: VmData, value: VmData) {
    this._keys.push(key);
    this._values.push(value);
    let index: Map<string, number[]> = (this as any)[INDEX];
    if(index) {
      let h = VmMap.hash(key);
      let list = index.get(h);
      if(list) list.push(this._keys.length - 1); else index.set(h, [this._keys.length - 1]);
    }
  }

  public has(key: VmData) {
    return this.indexOf(key) >= 0;
  }

  public get(key: VmData): VmData {
    let index = this.indexOf(key);
    return index >= 0 ? this._values[index] : null;
  }

  public delete(key: VmData): VmData {
    let index = this.indexOf(key);
    if (index >= 0) {
      let value = this._values[index];
      this._keys.splice(index, 1);
      this._values.splice(index, 1);
      (this as any)[INDEX] = null;
      return value;
    } else {
      return new VmNil();
    }
  }

  public size(): number {
    return this._keys.length;
  }

  public keys() {
    return this._keys.slice();
  }

  public values() {
    return this._values.slice();
  }
}

export { VmMap }
