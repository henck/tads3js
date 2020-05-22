import { VmData, VmObject } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Heap } from "../Heap";
import { MetaclassRegistry } from "./MetaclassRegistry";
import { IFuncInfo } from "../IFuncInfo";

type TPropFunc = ((...args: any[]) => VmData);
interface IPropFound {
  object: VmObject;
  prop: VmData | TPropFunc;
}
interface IPropAndDistance {
  prop: IPropFound;
  dist: number;
}

class Metaclass {
  public metaclassID: number;
  protected superClasses: number[];
  protected props: Map<number, VmData>;

  constructor() {
    this.props = new Map<number, VmData>();
    this.superClasses = [];
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('Cannot load meta object from image.');
  }

  unpack(): any {
    return null;
  }

  getMethodByIndex(idx: number): TPropFunc {
    return null;
  }

  callVirtualMethod(prop: TPropFunc, ...args: any[]) {
    // Bind prop to self, then call it with args.
    return prop.bind(this)(...args);
  }


  //
  // Does this class derive from a given class?
  // (Currently unused.)
  //
  private derivesFrom(objID: number): boolean {
    if(this.superClasses.includes(objID)) return true;
    return this.superClasses.reduce((prev:boolean, x:number) => 
      prev || Heap.getObj(x).derivesFrom(objID), false);
  }

  /**
   * Given a PropID, find the metaclass that the property exists on.
   * This can be the current class, or any of its parent classes all
   * the way up the inheritance tree. 
   * If a class is found that contains the property, convert it to
   * a function.
   * @param propID 
   */
  private getMetaProp(propID: number): TPropFunc {
    // See if propID corresponds to a metaprop. Look first in the current
    // class, then look in its parents.
    let index = null;
    let prototype:any = this;
    do {
      // Get the prototype of the current class. 
      prototype = Object.getPrototypeOf(prototype);
      if(prototype != null) {
        // Get the prototype's metaclassID, if any. Some base classes
        // may not have a metaclassID and must be ignored.
        let metaclassID = (prototype.constructor as any).metaclassID;
        if(!metaclassID) continue;
        // Get a prop index from the registry for the current metaclassID.
        index = MetaclassRegistry.getMetaIndex(metaclassID, propID);
      }
    } while(prototype != null && index == null);

    //console.log("FOUND prop ", propID, "as index", index, " on" , prototype);

    // If a metaprop index was found on the current prototype, convert it
    // to a function.
    if(index !== null) {
      let metaProp = prototype.getMethodByIndex(index);
      if(metaProp == null) {
        throw("CANNOT FIND METAPROP " + index.toString());
      }
      return metaProp;
    }

    // Index was not found on any prototype, so we return null.
    return null;
  }


  //
  // Retrieve a prop from this instance, by propID.
  // - See if propID corresponds to a metaprop. If so, return
  //   its function.
  // - If not, try regular props. Return prop or null if not found.
  // 
  private getProp(propID: number): VmData | TPropFunc {
    // Find a meta property:
    let f = this.getMetaProp(propID);
    if(f) return f;
    // If no metaproperty found, find ordinary property:
    return this.props.has(propID) ? this.props.get(propID) : null;
  }

  //
  // Starting with this instance, walk up the inheritance tree looking
  // for a prop by propID. If found, store the prop in a list along
  // with its distance up the tree from the original instance.
  // 
  private findPropWalker(propID: number, dist?: number): IPropAndDistance[] {
    let lst: IPropAndDistance[] = [];
    // If I have this property, add myself to the list with the current distance
    // from the original caller. 
    let prop = this.getProp(propID);
    if(prop) lst.push({prop: {object: new VmObject(this), prop: prop}, dist: dist ?? 0});
    // Go through my superclasses, and call findProp on them (increasing the distance
    // by 1).
    for(let i = 0; i < this.superClasses.length; i++) {
      let superClassID = this.superClasses[i];
      let obj = Heap.getObj(superClassID);
      let sublst = obj.findPropWalker(propID, dist ? dist + 1 : 1);
      lst = lst.concat(sublst);
    }
    // Return list of props and distances.
    return lst;
  }

  public findProp(propID: number): IPropFound {
    let lst: IPropAndDistance[] = this.findPropWalker(propID);

    // Calculate the minimum distance in the list.
    let minDist = lst.reduce((p, x) => Math.min(p, x.dist), 999);

    // Remove all elements that have a distance greater than minDist.
    lst = lst.filter((x) => x.dist <= minDist);

    // Prop not found at all?
    if(lst.length == 0) return undefined;

    // We use the object that comes last in a list of superclasses (at the same level);
    // that is, the last element of the list of matches.
    return lst[lst.length-1].prop;
  }  

  getValue(): any {
    return null;
  }  

  //
  // OPERATORS
  //

  negate(): VmData {
    throw('CANNOT_NEGATE_TYPE');
  }

  add(data: VmData): VmData {
    throw('CANNOT_ADD_TYPE');
  }

  subtract(data: VmData): VmData {
    throw('CANNOT_SUBTRACT_TYPE');
  }

  equals(data: VmData): boolean {
    throw('CANNOT_COMPARE_TYPE');
  }

  compare(data: VmData): boolean {
    throw('CANNOT_COMPARE_TYPE');
  }

  getindex(vmIndex: VmData): VmData {
    throw('CANNOT_INDEX_TYPE');
  }

  setindex(vmIndex: VmData, data: VmData): VmObject {
    throw('CANNOT_INDEX_TYPE');
  }  

  invoke(...args: VmData[]): VmData {
    throw('CANNOT_INVOKE_TYPE');
  }

  funcinfo(): IFuncInfo {
    throw('NOT A FUNCTION');
  }

}

export { Metaclass, TPropFunc, IPropFound }