import { VmData, VmObject, VmNil, VmTrue, VmList, VmProp, VmInt, VmNativeCode, VmFuncPtr, VmCodeOffset } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Heap } from "../Heap";
import { MetaclassRegistry } from "./MetaclassRegistry";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "../types/VmType";
import { Vm } from "../Vm";

interface IPropLocation {
  object: VmObject;
  prop: VmData;
}

interface IPropAndDistance {
  prop: IPropLocation;
  dist: number;
}

class RootObject {
  public id: number;
  public metaclassID: number;
  protected superClasses: number[];
  protected props: Map<number, VmData>;
  private _isTransient: boolean;

  constructor() {
    this.props = new Map<number, VmData>();
    this.superClasses = [];
    this._isTransient = false;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    throw('Cannot load meta object from image.');
  }

  public setID(id: number) {
    this.id = id;
  }

  public setTransient(transient: boolean) {
    this._isTransient = transient;
  }

  public getType() {
    return VmType.OBJ;
  }

  unpack(): any {
    return this;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode(this.ofKind, 1);
      case 1: return new VmNativeCode(this.getSuperclassList, 0);
      case 2: return new VmNativeCode(this.propDefined, 1, 1);
      case 3: return new VmNativeCode(this.propType, 1);
      case 4: return new VmNativeCode(this.getPropList, 0);
      case 5: return new VmNativeCode(this.getPropParams, 1);
      case 6: return new VmNativeCode(this.metaIsClass, 0);
      // propInherited (multimethod only)
      case 8: return new VmNativeCode(this.isTransient, 0);
    }
    return null;
  }  

  public callNativeMethod(data: VmNativeCode, ...args: any[]) {
    // Bind prop to self, then call it with args.
    return data.value.bind(this)(...args);
  }

  protected isClass(): VmData {
    return new VmNil();
  }


  /**
   * Does this class derive from a given class 
   * _through the superclasses chain_ ?
   * @param obj Ancestor class
   * @returns true if descendant
   */
  protected derivesFromSuperclass(objID: number): boolean {
    if(this.superClasses.includes(objID)) return true;
    return this.superClasses.reduce((prev:boolean, x:number) => 
      prev || Heap.getObj(x).derivesFromSuperclass(objID), false);
  }

  /**
   * Is this class an ancestor of the given class
   * _through the metaclasses inheritance chain_ ?
   * @param obj Descendant class
   * @returns true if ancestor
   */
  protected isAncestor(obj: RootObject) {
    return obj.derivesFromSuperclass(this.id);
  }

  /**
   * Get a chain of metaclass IDs of classes that are ancestors of this instance,
   * in order from closest to furthest.
   * @returns e.g. [4,10,10,8]
   */
  public getMetaChain() {
    let classes = [];
    let prototype:any = this;
    do {
      prototype = Object.getPrototypeOf(prototype);
      if(prototype && prototype.constructor.metaclassID != undefined) {
        classes.push(prototype.constructor.metaclassID);
      }
    } while(prototype != null);
    // Remove duplicate values resulting from base classes in chain
    // that do not introduce a new metaclassID:
    return [...new Set(classes)];
  }

  /**
   * Given a PropID, find the metaclass that the property exists on.
   * This can be the current class, or any of its parent classes all
   * the way up the inheritance tree. 
   * If a class is found that contains the property, convert it to
   * a function.
   * @param propID 
   */
  private getMetaProp(propID: number): VmNativeCode {
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
        if(metaclassID == undefined) continue;
        // Get a prop index from the registry for the current metaclassID.
        index = MetaclassRegistry.getMetaIndex(metaclassID, propID);
      }
    } while(prototype != null && index == null);

    //console.log("FOUND prop ", propID, "as index", index, " on" , prototype);

    // If a metaprop index was found on the current prototype, convert it
    // to a function.
    if(index !== null) {
      let vmNativeCode = prototype.getMethodByIndex(index) as VmNativeCode;
      if(vmNativeCode == null) {
        throw("CANNOT FIND METAPROP " + index.toString());
      }
      return vmNativeCode;
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
  private getProp(propID: number): VmData {
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

  public findProp(propID: number, onlyInherited: boolean): IPropLocation {
    let lst: IPropAndDistance[] = this.findPropWalker(propID);

    // If looking only for inherited properties, ignore properties with
    // distance 0.
    if(onlyInherited) {
      lst = lst.filter((propdist) => propdist.dist > 0);
    }

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

  setprop(propID: number, data: VmData) {
    this.props.set(propID, data);
  }

  invoke(...args: VmData[]): VmData {
    throw('CANNOT_INVOKE_TYPE');
  }

  funcinfo(): IFuncInfo {
    throw('NOT A FUNCTION');
  }

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   /**
    * Returns a list of the properties directly defined by this object. 
    * Each entry in the list is a property pointer value. 
    */
  protected getPropList(): VmData {
    let arr = [];
    for(let p of this.props.keys()) {
      arr.push(new VmProp(p));
    }
    return new VmList(arr);
  }

  /**
   * Returns information on the parameters taken by the given property or method of this object. 
   * @param vmProp Property
   * @returns List with three elements
   */
  protected getPropParams(vmProp: VmProp): VmData {
    // Retrieve propInfo for given prop. Among other things, this includes the prop's value.
    let propInfo = Vm.getInstance().getprop(new VmObject(this), vmProp, false);
    // By default, we return no params, no opt params, no varying args
    // (even if the prop was not found)
    let result = [new VmInt(0), new VmInt(0), new VmNil()];
    if(propInfo)  {
      // For native code, get the param info from the VmNativeCode object.
      if(propInfo.data instanceof VmNativeCode) {
        result = [new VmInt(propInfo.data.params), new VmInt(propInfo.data.optParams), propInfo.data.varyingParams ? new VmTrue() : new VmNil()];
      }
      // For a static function, get the function info from the image.
      if(propInfo.data instanceof VmCodeOffset) {
         let info = Vm.getInstance().getFuncInfo(propInfo.data.value);
         result = [new VmInt(info.params), new VmInt(info.optParams), info.varargs ? new VmTrue() : new VmNil()];
      }
    }
    return new VmList(result);
  }

  /**
   * Returns a list containing the immediate superclasses of the object. 
   */
  protected getSuperclassList(): VmData {
    // Forced to use VmList here rather than List, to avoid a
    // circular reference: List imports RootObject, so RootObject
    // cannot import List.
    return new VmList(this.superClasses.map((sc) => Heap.getObj(sc)));
  }

  /**
   * Returns true if the object was declared as a "class", nil otherwise. 
   * @returns true if object is class
   */
  protected metaIsClass(): VmData {
    return this.isClass();
  }

  /**
   * Returns true if the object is transient, nil otherwise. 
   * @returns true if object is transient
   */
  protected isTransient(): VmData {
    return this._isTransient ? new VmTrue() : new VmNil();
  }

  /**
   * Determines if the object is an instance of the class cls, or an instance 
   * of any subclass of cls. Returns true if so, nil if not. This method always 
   * returns true if cls is Object, since every object ultimately derives from the Object intrinsic class. 
   * @param vmClass Ancestor class
   * @returns true if descendent, nil if not
   */
  protected ofKind(vmClass: VmObject): VmData {
    let obj = vmClass.getInstance();
    return obj.isAncestor(this) ? new VmTrue() : new VmNil();
  }

  /**
   * Determines if the object defines or inherits the property prop.
   * @param prop Prop
   * @param flags 
   */
  protected propDefined(vmProp: VmProp, vmFlags?: VmInt): VmData {
    let flags = vmFlags ? vmFlags.unpack(): 1;
    let propID = vmProp.unpack();
    let propFound = this.findProp(propID, false);
    if(!propFound) return new VmNil();
    switch(flags) {
      case 1: // PropDefAny
        return new VmTrue();
      case 2: // PropDefDirectly
        return propFound.object.getInstance() == this ? new VmTrue() : new VmNil();
      case 3: // PropDefInherits
        return propFound.object.getInstance() != this ? new VmTrue() : new VmNil();
      case 4: // PropDefGetClass
        return propFound.object;
      default:
        throw(`propDefined: Unknown flag ${flags}`);
    }
  }

  /**
   * Returns the datatype of the given property of the given object, or nil if the object does not 
   * define or inherit the property. This function does not evaluate the property, but merely determines 
   * its type. The return value is one of the TYPE_xxx values.
   * @param prop Prop to check
   * @returns Prop type (int)
   */
  protected propType(prop: VmProp): VmData {
    let propFound = this.findProp(prop.value, false);
    // nil if prop not found
    if(!propFound) return new VmNil();
    // If a primitive type, return type code.
    if(propFound.prop instanceof VmData) return new VmInt((propFound.prop as VmData).getType());
    // Otherwise, it is an intrinsic class method.
    return new VmInt(VmType.NATIVE_CODE);
  }

}

MetaclassRegistry.register('root-object/030004', RootObject);

export { RootObject, IPropLocation }

