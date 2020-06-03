import { VmData, VmObject, VmNil, VmInt } from "../../types";
import { Heap } from "../../Heap";
import { RootObject } from "../../metaclass/RootObject";

const ObjInstances = 0x1;
const ObjClasses = 0x2;
const ObjAll = 0x3;

function findNextObj(fromID: number, vmClass?: VmObject, vmFlags?: VmInt): VmData {
  let flags = vmFlags ? vmFlags.unpack() : ObjInstances;
  let classID = vmClass instanceof VmObject ? vmClass.value : null;
  
  // Go through all objects on heap.
  let res = Heap.findFromKey(fromID, (id: number, value: RootObject, isIntrinsic: boolean) => {
    // Check ancestor:
    let match = !classID || vmClass.getInstance().isAncestor(value);
    // Check class/instance requirement
    if((flags & ObjInstances) && value.isClass()) match = false;
    if((flags & ObjClasses) && !value.isClass()) match = false;
    // If a match, return it.
    return match;
  });
  if(!res) return new VmNil();
  return new VmObject(res.key);
}

/**
 * Get the first object of class cls. 
 * @param vmClass Ancestor class, or nil
 * @param vmFlags Flags
 */
export function builtin_firstObj(vmClass?: VmObject, vmFlags?: VmInt): VmData {
  return findNextObj(null, vmClass, vmFlags);
}

/**
 * Get the next object after obj of class cls. 
 * @param vmObject Previous object
 * @param vmClass Ancestor class, or nil
 * @param vmFlags Flags
 */
export function builtin_nextObj(vmObject: VmObject, vmClass?: VmObject, vmFlags?: VmInt): VmData {
  return findNextObj(vmObject.value, vmClass, vmFlags);
}
