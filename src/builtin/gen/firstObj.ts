import { VmData, VmObject, VmNil, VmInt } from "../../types";
import { Heap } from "../../Heap";
import { RootObject, Lookup } from "../../metaclass/RootObject";

const ObjInstances = 0x1;
const ObjClasses = 0x2;

/**
 * Index of the objects matching a firstObj()/nextObj() query (a class and
 * flags), in order of object ID. Games enumerate the instances of a class
 * often, so this is kept up to date incrementally: new objects (which have
 * higher IDs than all others) are checked as they appear; deleted objects
 * are skipped; and if inheritance changes (or a program is loaded), the
 * index is rebuilt.
 */
interface IIndex {
  version: number;
  ids: number[];
  upTo: number;   // objects with IDs up to this have been checked
}
const indexes = new Map<string, IIndex>();

function matches(obj: RootObject, cls: RootObject, flags: number): boolean {
  if(!(flags & (obj.isClass() ? ObjClasses : ObjInstances))) return false;
  return !cls || cls.isAncestor(obj);
}

function getIndex(classID: number, flags: number): IIndex {
  let ids = Heap.sortedIDs();
  let key = classID + ':' + flags;
  let index = indexes.get(key);
  if(!index || index.version != Lookup.version) {
    index = { version: Lookup.version, ids: [], upTo: 0 };
    indexes.set(key, index);
  }
  // Check objects created since the index was last used.
  let last = ids.length ? ids[ids.length - 1] : 0;
  if(last > index.upTo) {
    let cls = classID ? Heap.getObj(classID) : null;
    for(let i = Heap.indexAfter(ids, index.upTo); i < ids.length; i++) {
      let obj = Heap.getObj(ids[i]);
      if(obj && matches(obj, cls, flags)) index.ids.push(ids[i]);
    }
    index.upTo = last;
  }
  return index;
}

function findNextObj(fromID: number, vmClass?: VmData, vmFlags?: VmData): VmData {
  let flags = vmFlags instanceof VmInt ? vmFlags.unpack() : ObjInstances;
  let classID = vmClass instanceof VmObject ? vmClass.value : 0;
  let index = getIndex(classID, flags);
  for(let i = fromID === null ? 0 : Heap.indexAfter(index.ids, fromID); i < index.ids.length; i++) {
    // (Skip objects deleted by the garbage collector.)
    if(Heap.getObj(index.ids[i])) return new VmObject(index.ids[i]);
  }
  return new VmNil();
}

/**
 * Get the first object of class cls.
 * @param vmClass Ancestor class, or nil
 * @param vmFlags Flags
 */
export function builtin_firstObj(vmClass?: VmData, vmFlags?: VmData): VmData {
  // firstObj(flags) is allowed too.
  if(vmClass instanceof VmInt && vmFlags === undefined) return findNextObj(null, null, vmClass);
  return findNextObj(null, vmClass, vmFlags);
}

/**
 * Get the next object after obj of class cls.
 * @param vmObject Previous object
 * @param vmClass Ancestor class, or nil
 * @param vmFlags Flags
 */
export function builtin_nextObj(vmObject: VmObject, vmClass?: VmData, vmFlags?: VmData): VmData {
  if(vmClass instanceof VmInt && vmFlags === undefined) return findNextObj(vmObject.value, null, vmClass);
  return findNextObj(vmObject.value, vmClass, vmFlags);
}
