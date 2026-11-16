import { Platform } from './Platform';
import { RootObject } from "./metaclass/RootObject";
import { MetaclassFactory } from "./metaclass/MetaclassFactory";
import { Heap } from "./Heap";
import { Undo } from "./Undo";
import { VmData, VmObject, VmNil } from "./types";
import { VmRuntimeError, VmErr } from "./VmErrors";
import { VmMap } from "./metaimp/VmMap";
import { IntrinsicClass, MetaString, List, BigNumber, RexPattern, StringComparator } from "./metaimp";
const Decimal = require('decimal.js');

/** An object loaded from the image file. */
export interface IStaticObject {
  id: number;
  metaclass: number;
  offset: number;
  size: number;
  transient: boolean;
}

/** What Persist needs to know about the loaded program. */
export interface IProgram {
  imageTimestamp: string;
  staticObjects: IStaticObject[];
  image: any;
  dataPool: any;
}

const SIGNATURE = 'T3JS-state-v2\n';

// Short tags for common value classes in saved files.
const SHORT: { [name: string]: string } = {
  VmInt: 'i', VmObject: 'o', VmSstring: 's', VmList: 'l', VmProp: 'p', VmNil: 'n', VmTrue: 't', VmCodeOffset: 'c',
};
const LONG: { [tag: string]: string } = {};
for(let k of Object.keys(SHORT)) LONG[SHORT[k]] = k;

/** Are these all plain objects with the same keys (in the same order)? */
function sameShape(a: any[]): string[] | null {
  if(a.length < 2 || !a[0] || Object.getPrototypeOf(a[0]) !== Object.prototype) return null;
  let keys = Object.keys(a[0]);
  for(let x of a) {
    if(!x || Object.getPrototypeOf(x) !== Object.prototype) return null;
    let k = Object.keys(x);
    if(k.length != keys.length || k.some((key, i) => key != keys[i])) return null;
  }
  return keys;
}

// Classes whose state can't change: their static instances aren't saved.
const IMMUTABLE = [IntrinsicClass, MetaString, List, BigNumber, RexPattern, StringComparator];

// Constructors by name, for recreating values and objects.
let vmDataClasses: Map<string, any> = null;
let objectClasses: Map<string, any> = null;
// Class names (from the modules' exports, as bundlers may rename the classes themselves).
let classNames: Map<any, string> = null;

function className(c: any): string {
  let name = classNames.get(c);
  if(!name) throw new Error('saveGame: cannot save ' + c.name);
  return name;
}

function classes() {
  if(vmDataClasses) return;
  vmDataClasses = new Map();
  objectClasses = new Map();
  classNames = new Map();
  const add = (name: string, c: any) => {
    if(typeof(c) != 'function') return;
    if(c === VmData || c.prototype instanceof VmData) vmDataClasses.set(name, c);
    else if(c === RootObject || c.prototype instanceof RootObject) objectClasses.set(name, c);
    else return;
    classNames.set(c, name);
  };
  add('RootObject', RootObject);
  // (Static requires, so a bundler can resolve them.)
  for(let m of [require('./types'), require('./metaimp'), require('./types/VmAnonMethod'),
                require('./metaimp/IndexedIterator'), require('./metaimp/LookupTableIterator')]) {
    for(let k of Object.keys(m)) add(k, m[k]);
  }
}

/** A string argument naming a file (nil isn't allowed). */
function fileNameArg(v: VmData): string {
  if(!v || v instanceof VmNil) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  let s = v.unpack();
  if(typeof(s) != 'string') s = v.toStr();
  return s;
}

/**
 * Saving and restoring the state of all persistent objects, and resetting
 * it to the initial state (restart). The file format is our own (JSON).
 */
export class Persist {

  /**
   * Save persistent objects to a file: the static objects, and the dynamic
   * objects they reference. References to transient objects are saved as nil.
   */
  static save(program: IProgram, vmFile: VmData, vmMeta?: VmData) {
    classes();
    let filename = fileNameArg(vmFile);
    let queue: RootObject[] = [];
    let queued = new Set<number>();
    let staticIDs = new Set(program.staticObjects.map((s) => s.id));
    const immutable = (obj: RootObject) => IMMUTABLE.some((c) => obj instanceof c);

    const enqueue = (id: number): boolean => {
      let obj = Heap.getObj(id);
      if(!obj || obj.isTransientObj()) return false;
      // Unchangeable static objects are referenced, but their state isn't saved.
      if(!queued.has(id) && !(staticIDs.has(id) && immutable(obj))) { queued.add(id); queue.push(obj); }
      return true;
    };
    // Encoding a static object's image state (only to compare it): no queueing.
    const isSaved = (id: number): boolean => {
      let obj = Heap.getObj(id);
      return !!obj && !obj.isTransientObj();
    };

    let ref = enqueue;
    const enc = (v: any): any => {
      if(v === null || typeof(v) == 'number' || typeof(v) == 'string' || typeof(v) == 'boolean') return v;
      if(v === undefined) return { $: 'U' };
      if(Array.isArray(v)) {
        // Records of the same shape: a table.
        let keys = sameShape(v);
        if(keys) return { $: 'T', k: keys, r: v.map((x) => keys.map((k) => enc(x[k]))) };
        return v.map(enc);
      }
      if(v instanceof Map) return { $: 'Map', e: Array.from(v.entries()).map(([k, x]) => [enc(k), enc(x)]) };
      if(v instanceof VmMap) return { $: 'VmMap', k: enc((v as any)._keys), v: enc((v as any)._values) };
      if(Decimal.isDecimal(v)) return { $: 'Dec', s: v.isZero() && v.isNeg() ? '-0' : v.toString() };
      if(v instanceof VmObject) return ref(v.value) ? { $: 'o', v: v.value } : { $: 'n', v: null };
      if(v instanceof VmData) {
        // Most values have only a 'value' field: { $: class, v: value }.
        let keys = Object.keys(v);
        let name = className(v.constructor);
        if(keys.length == 1 && keys[0] == 'value') return { $: SHORT[name] || name, v: enc(v.value) };
        return { $: 'D', c: name, f: fields(v) };
      }
      if(v instanceof RootObject) return ref(v.id) ? { $: 'O', id: v.id } : null;
      if(Object.getPrototypeOf(v) === Object.prototype) return { $: 'P', f: fields(v) };
      throw new Error('saveGame: cannot save ' + (v.constructor ? v.constructor.name : typeof(v)));
    };
    const fields = (v: any) => {
      let out: any = {};
      for(let k of Object.keys(v)) out[k] = enc(v[k]);
      return out;
    };
    const stateOf = (obj: RootObject) => {
      let state = obj.saveState();
      if(obj instanceof RexPattern) delete state.regexp;
      return fields(state);
    };

    let statics = new Map<number, IStaticObject>();
    for(let s of program.staticObjects) {
      let obj = Heap.getObj(s.id);
      if(!obj || s.transient || immutable(obj)) continue;
      statics.set(s.id, s);
      enqueue(s.id);
    }
    // Static objects are saved only if they differ from their initial state
    // (restoring resets the others).
    let objects: any[] = [];
    for(let i = 0; i < queue.length; i++) {
      let obj = queue[i];
      let state = stateOf(obj);
      let s = statics.get(obj.id);
      if(s) {
        let fresh = Persist.loadInitial(program, s);
        if(fresh) {
          ref = isSaved;
          let initial = stateOf(fresh);
          ref = enqueue;
          let d = Persist.delta(initial, state);
          if(d) objects.push({ id: obj.id, c: null, d: d });
          continue;
        }
      }
      objects.push({ id: obj.id, c: staticIDs.has(obj.id) ? null : className(obj.constructor), s: state });
    }

    // Metadata: the string keys and values of a LookupTable.
    let meta: [string, string][] = [];
    if(vmMeta instanceof VmObject) {
      let table = vmMeta.getInstance().getValue();
      if(table instanceof VmMap) {
        for(let k of table.keys()) {
          let key = k.unpack(), val = table.get(k).unpack();
          if(typeof(key) == 'string' && typeof(val) == 'string') meta.push([key, val]);
        }
      }
    }

    let text = SIGNATURE + JSON.stringify({ image: program.imageTimestamp, meta: meta, objects: objects });
    try {
      Platform.get().fs.writeFile(filename, text);
    } catch(e) {
      throw new VmRuntimeError(VmErr.CREATE_FILE);
    }
  }

  /**
   * Restore persistent objects from a file. Static objects get their saved
   * state; saved dynamic objects are recreated (with new IDs). Existing
   * dynamic objects are left alone, and undo information is discarded.
   */
  static restore(program: IProgram, vmFile: VmData) {
    classes();
    let filename = fileNameArg(vmFile);
    let text: string;
    let data: Uint8Array;
    try {
      data = Platform.get().fs.readFile(filename);
    } catch(e) {
      throw new VmRuntimeError(VmErr.READ_FILE);
    }
    if(data === null) throw new VmRuntimeError(VmErr.FILE_NOT_FOUND);
    text = new TextDecoder().decode(data);
    if(!text.startsWith(SIGNATURE)) throw new VmRuntimeError(VmErr.NOT_SAVE_FILE);
    let saved: any;
    try {
      saved = JSON.parse(text.substr(SIGNATURE.length));
    } catch(e) {
      throw new VmRuntimeError(VmErr.SAVE_FILE_CORRUPT);
    }
    if(saved.image !== program.imageTimestamp) throw new VmRuntimeError(VmErr.WRONG_SAVE_FILE);

    // Create the dynamic objects first, so references to them can be mapped.
    let ids = new Map<number, number>();
    let objects = new Map<number, RootObject>();
    for(let o of saved.objects) {
      if(o.c === null) {
        let obj = Heap.getObj(o.id);
        if(!obj) throw new VmRuntimeError(VmErr.SAVE_FILE_CORRUPT);
        objects.set(o.id, obj);
      } else {
        let cls = objectClasses.get(o.c);
        if(!cls) throw new VmRuntimeError(VmErr.SAVE_FILE_CORRUPT);
        let obj: RootObject = Object.create(cls.prototype);
        Heap.addObj(obj);
        ids.set(o.id, obj.id);
        objects.set(o.id, obj);
      }
    }
    const mapID = (id: number) => ids.has(id) ? ids.get(id) : id;

    const dec = (v: any): any => {
      if(v === null || typeof(v) != 'object') return v;
      if(Array.isArray(v)) return v.map(dec);
      switch(v.$) {
        case 'U': return undefined;
        case 'Map': return new Map(v.e.map(([k, x]: any) => [dec(k), dec(x)]));
        case 'VmMap': return new VmMap(dec(v.k), dec(v.v));
        case 'Dec': return new Decimal(v.s);
        case 'O': return Heap.getObj(mapID(v.id));
        case 'P': return decFields(v.f, {});
        case 'T': return v.r.map((row: any[]) => {
          let x: any = {};
          v.k.forEach((k: string, i: number) => x[k] = dec(row[i]));
          return x;
        });
        case 'D': {
          let cls = vmDataClasses.get(v.c);
          if(!cls) throw new VmRuntimeError(VmErr.SAVE_FILE_CORRUPT);
          let d = decFields(v.f, Object.create(cls.prototype));
          if(d instanceof VmObject) d.value = mapID(d.value);
          return d;
        }
      }
      // A value with only a 'value' field.
      let cls = vmDataClasses.get(LONG[v.$] || v.$);
      if(!cls) throw new VmRuntimeError(VmErr.SAVE_FILE_CORRUPT);
      let d = Object.create(cls.prototype);
      d.value = cls === VmObject ? mapID(v.v) : dec(v.v);
      return d;
    };
    const decFields = (f: any, target: any) => {
      for(let k of Object.keys(f)) target[k] = dec(f[k]);
      return target;
    };

    // Static objects are saved as changes to their initial state.
    Persist.resetStatics(program);

    for(let o of saved.objects) {
      let obj = objects.get(o.id);
      if(o.d) {
        let state: any = {};
        for(let k of Object.keys(o.d)) {
          let v = o.d[k], old = (obj as any)[k];
          if(v && v.$ == 'Add' && Array.isArray(old)) state[k] = old.slice(0, v.n).concat(dec(v.a));
          else if(v && v.$ == 'MapD' && old instanceof Map) {
            let m = new Map(old);
            for(let x of v.del) m.delete(dec(x));
            for(let [x, y] of v.set) m.set(dec(x), dec(y));
            state[k] = m;
          }
          else state[k] = dec(v);
        }
        obj.restoreState(state);
      }
      else obj.restoreState(decFields(o.s, {}));
      if(obj instanceof RexPattern) (obj as any).compile();
    }
    Undo.clear();
  }

  /** Reset all persistent static objects to their state in the image file. */
  static restart(program: IProgram) {
    Persist.resetStatics(program);
    Undo.clear();
  }

  /** Reset the persistent static objects to their initial state. */
  private static resetStatics(program: IProgram) {
    for(let s of program.staticObjects) {
      if(s.transient) continue;
      let obj = Heap.getObj(s.id);
      if(!obj || IMMUTABLE.some((c) => obj instanceof c)) continue;
      let fresh = Persist.loadInitial(program, s);
      if(fresh) obj.restoreState(fresh.saveState());
    }
  }

  /**
   * The changes from an object's initial state to its current state (both
   * encoded), field by field: a changed field's new value; for an array
   * that was added to, { $: 'Add', n: initial length, a: added elements };
   * for a Map, { $: 'MapD', set: changed entries, del: deleted keys }.
   * Null if nothing changed.
   */
  private static delta(initial: any, current: any): any {
    let out: any = null;
    for(let k of Object.keys(current)) {
      let a = initial[k], b = current[k];
      let d = Persist.fieldDelta(a, b);
      if(d !== undefined) (out || (out = {}))[k] = d;
    }
    return out;
  }

  /** A field's change (see delta()); undefined if unchanged. */
  private static fieldDelta(a: any, b: any): any {
    let ja = JSON.stringify(a), jb = JSON.stringify(b);
    if(ja === jb) return undefined;
    // Rows added to a table, or elements added to an array.
    let rowsA = a && a.$ == 'T' ? a.r : Array.isArray(a) ? a : null;
    let rowsB = b && b.$ == 'T' ? b.r : Array.isArray(b) ? b : null;
    if(rowsA && rowsB && rowsB.length > rowsA.length && (a.$ == 'T') == (b.$ == 'T')
       && (a.$ != 'T' || JSON.stringify(a.k) == JSON.stringify(b.k))
       && rowsA.every((x: any, i: number) => JSON.stringify(x) === JSON.stringify(rowsB[i]))) {
      let added = rowsB.slice(rowsA.length);
      return { $: 'Add', n: rowsA.length, a: b.$ == 'T' ? { $: 'T', k: b.k, r: added } : added };
    }
    // Changed entries of a Map (if the old keys keep their order).
    if(a && b && a.$ == 'Map' && b.$ == 'Map') {
      let old = new Map<string, string>(a.e.map(([k, v]: any) => [JSON.stringify(k), JSON.stringify(v)]));
      let keysB = b.e.map(([k]: any) => JSON.stringify(k));
      let kept = keysB.filter((k: string) => old.has(k));
      let oldKept = Array.from(old.keys()).filter((k) => keysB.includes(k));
      let newAtEnd = keysB.slice(kept.length).every((k: string) => !old.has(k));
      if(newAtEnd && kept.every((k: string, i: number) => k === oldKept[i])) {
        let keySet = new Set(keysB);
        return {
          $: 'MapD',
          set: b.e.filter(([k, v]: any) => old.get(JSON.stringify(k)) !== JSON.stringify(v)),
          del: a.e.filter(([k]: any) => !keySet.has(JSON.stringify(k))).map(([k]: any) => k),
        };
      }
    }
    return b;
  }

  /** A static object as loaded from the image (not on the heap). */
  private static loadInitial(program: IProgram, s: IStaticObject): RootObject | null {
    return Heap.unregistered(() => MetaclassFactory.load(s.metaclass, program.image, program.dataPool, s.offset, s.size));
  }
}
