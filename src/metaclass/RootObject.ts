import { VmData, VmObject, VmNil, VmTrue, VmList, VmProp, VmInt, VmNativeCode, VmFuncPtr, VmCodeOffset, VmSstring } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Heap } from "../Heap";
import { MetaclassRegistry } from "./MetaclassRegistry";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "../types/VmType";
import { Vm } from "../Vm";
import { Symbols } from "../Symbols";
import { Undo } from "../Undo";
import { Gc } from "../Gc";
import { VmMap } from "../metaimp/VmMap";

interface IPropLocation {
  object: VmObject;
  prop: VmData;
}

// (Loaded lazily, to avoid a circular import.)
let intrinsicClass: any = null;

/** Where a property is defined: the object, and its native method if any. */
interface ICachedDef {
  obj: RootObject;
  ref: VmObject;
  meta: VmNativeCode;
}

/** Cached property lookup information for an object. */
interface ILookupCache {
  version: number;
  superClasses: number[];     // (to notice changes to the superclass list)
  length: number;
  order: number[];            // inheritance order
  defs: Map<number, ICachedDef | null>;  // property -> where it's defined (null: nowhere)
}

/**
 * Property lookup caching. Caches are invalidated when
 * the global version changes: when an object that others inherit from
 * gets a new property, when a superclass list changes, or when objects are
 * restored or reloaded.
 */
export class Lookup {
  static version = 0;
  // Objects that are in some object's inheritance order (besides their own).
  static parents = new Set<number>();
  // Each object's cache is stored on it under this key (a Symbol, so
  // Object.keys() and so undo snapshots, saving and the garbage collector
  // don't see it).
  static readonly CACHE = Symbol('lookupCache');
  // Per JavaScript class: property -> native method (or null).
  static metaCache = new Map<any, Map<number, VmNativeCode>>();

  static invalidate() {
    Lookup.version++;
  }

  /** After loading a program. */
  static reset() {
    Lookup.version++;
    Lookup.parents.clear();
    Lookup.metaCache.clear();
  }
}

class RootObject {
  public id: number;
  protected superClasses: number[];
  protected props: Map<number, VmData>;
  protected _isTransient: boolean;
  protected _isClass: boolean;

  constructor() {
    this.id = Heap.addObj(this);
    this.props = new Map<number, VmData>();
    this.superClasses = [];
    // By default, objects are persistent:
    this._isTransient = false;
    // By default, this is an instance, not a class.
    this._isClass = false;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number, size?: number): RootObject {
    throw('Cannot load meta object from image.');
  }

  public setID(id: number) {
    this.id = id;
  }

  public setTransient(transient: boolean) {
    this._isTransient = transient;
  }

  /** The IDs of the properties the object itself defines. */
  public getPropIDs(): number[] {
    return Array.from(this.props.keys());
  }

  public isTransientObj(): boolean {
    return this._isTransient;
  }

  /** Record undo for this object; called before any change to its state. */
  protected beforeChange() {
    Undo.record(this);
  }

  /**
   * A snapshot of the object's state (except its ID), for undo and saving: a copy of each field, with
   * arrays, Maps and VmMaps copied one level deep. Metaclasses whose state
   * is nested more deeply must override this.
   */
  public saveState(): any {
    let state: any = {};
    for(let key of Object.keys(this)) {
      if(key == 'id') continue;
      let v = (this as any)[key];
      if(Array.isArray(v)) v = v.slice();
      else if(v instanceof Map) v = new Map(v);
      else if(v instanceof VmMap) v = v.clone();
      state[key] = v;
    }
    return state;
  }

  /** Restore a snapshot made by saveState(). */
  public restoreState(state: any) {
    Lookup.invalidate();
    for(let key of Object.keys(state)) {
      let v = state[key];
      if(Array.isArray(v)) v = v.slice();
      else if(v instanceof Map) v = new Map(v);
      else if(v instanceof VmMap) v = v.clone();
      (this as any)[key] = v;
    }
  }

  public getType() {
    return VmType.OBJ;
  }

  unpack(): any {
    return this;
  }

  public isClass(): boolean {
    return this._isClass;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("RootObject.ofKind", this.ofKind, 1);
      case 1: return new VmNativeCode("RootObject.getSuperclassList", this.metaGetSuperclassList, 0);
      case 2: return new VmNativeCode("RootObject.propDefined", this.propDefined, 1, 1);
      case 3: return new VmNativeCode("RootObject.propType", this.propType, 1);
      case 4: return new VmNativeCode("RootObject.getPropList", this.getPropList, 0);
      case 5: return new VmNativeCode("RootObject.getPropParams", this.getPropParams, 1);
      case 6: return new VmNativeCode("RootObject.isClass", this.metaIsClass, 0);
      case 7: return new VmNativeCode("RootObject.propInherited", this.propInherited, 3, 1);
      case 8: return new VmNativeCode("RootObject.isTransient", this.isTransient, 0);
    }
    return null;
  }  

  public callNativeMethod(data: VmNativeCode, ...args: any[]) {
    // Bind prop to self, then call it with args (keeping what the native
    // code holds safe from garbage collection).
    return Gc.native(this, args, () => data.value.bind(this)(...args));
  }

  /**
   * For the garbage collector: mark objects this object refers to by ID
   * (as a number). References in VmData values and RootObject fields are
   * found automatically.
   */
  public gcRefs(mark: (id: number) => void) {
    this.superClasses.forEach(mark);
  }

  /** 
   * Find the IntrinsicClass instance of this object. 
   */
  private getIntrinsicClass(): VmObject {
    let res = null;
    Heap.forEach((id, object, isIntrinsic) => {
      if(isIntrinsic && (this.constructor as any).metaclassID == (object as any).metaclassIndex) {
          res = new VmObject(id);
      }
    });
    return res;
  }

  /**
   * Get the superclasses list of this object. This returns
   * its IntrinsicClass instance. (A TadsObject will override
   * this to return a list of superclasses).
   */
  protected getSuperclassList(): VmData {
    // Forced to use VmList here rather than List, to avoid a
    // circular reference: List imports RootObject, so RootObject
    // cannot import List.
    return new VmList([this.getIntrinsicClass()]);
  }


  /**
   * Does this class derive from a given class 
   * _through the superclasses chain_ ?
   * @param obj Ancestor class
   * @returns true if descendant
   */
  public derivesFromSuperclass(objID: number): boolean {
    // (The inheritance order is cached, so this is quick.)
    let order = this.getInheritanceOrder();
    for(let i = 1; i < order.length; i++) if(order[i] == objID) return true;
    return false;
  }

  /**
   * Is this class an ancestor of the given class
   * _through the metaclasses inheritance chain_ ?
   * @param obj Descendant class
   * @returns true if ancestor
   */
  public isAncestor(obj: RootObject) {
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
    let cls = this.constructor;
    let cache = Lookup.metaCache.get(cls);
    if(!cache) Lookup.metaCache.set(cls, cache = new Map());
    let f = cache.get(propID);
    if(f === undefined) {
      f = this.findMetaProp(propID);
      cache.set(propID, f);
    }
    return f;
  }

  private findMetaProp(propID: number): VmNativeCode {
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
        throw("CANNOT FIND METAPROP " + index.toString() + " ON " + MetaclassRegistry.indexToName((this.constructor as any).metaclassID));
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

  /**
   * Get this object's linearized inheritance order: this object first,
   * then its ancestors in the order in which they are searched for
   * properties. Per the T3 rules, this is a depth-first, left-to-right
   * expansion of the superclass tree in which only the last occurrence
   * of each class is kept, so no class precedes any of its subclasses.
   * @returns Object IDs, starting with this object's own ID
   */
  public getInheritanceOrder(): number[] {
    let c = this.lookupCache();
    if(!c.order) {
      let expanded: number[] = [];
      let walk = (obj: RootObject) => {
        expanded.push(obj.id);
        obj.superClasses.forEach((id) => walk(Heap.getObj(id)));
      };
      walk(this);
      // Keep the last occurrence of each object.
      let seen = new Set<number>();
      let order: number[] = [];
      for(let i = expanded.length - 1; i >= 0; i--) {
        if(!seen.has(expanded[i])) { seen.add(expanded[i]); order.push(expanded[i]); }
      }
      c.order = order.reverse();
      for(let i = 1; i < c.order.length; i++) Lookup.parents.add(c.order[i]);
    }
    return c.order;
  }

  /** This object's lookup cache (renewed if it's out of date). */
  private lookupCache(): ILookupCache {
    let c: ILookupCache = (this as any)[Lookup.CACHE];
    if(!c || c.version != Lookup.version || c.superClasses !== this.superClasses || c.length != this.superClasses.length) {
      c = { version: Lookup.version, superClasses: this.superClasses, length: this.superClasses.length, order: null, defs: new Map() };
      (this as any)[Lookup.CACHE] = c;
    }
    return c;
  }

  /**
   * Find the first object in the given part of the inheritance order
   * that defines the property.
   */
  private findPropIn(order: number[], propID: number): IPropLocation {
    for(let id of order) {
      // (An object that isn't on the heap has ID 0: see Heap.unregistered.)
      let obj = id === this.id ? this : Heap.getObj(id);
      let prop = obj.getProp(propID);
      if(prop) return { object: obj.id ? new VmObject(id) : VmObject.direct(obj), prop: prop };
    }
    return undefined;
  }

  /**
   * Find a property on this object or its ancestors.
   * @param propID Property to look for
   * @returns Property value and the object defining it, or undefined
   */
  public findProp(propID: number): IPropLocation {
    // (Temporary objects that aren't on the heap aren't worth caching.)
    if(this.id === 0) return this.findPropIn(this.getInheritanceOrder(), propID) || this.findModifierProp(propID);
    let c = this.lookupCache();
    let def = c.defs.get(propID);
    if(def === undefined) {
      let loc = this.findPropIn(this.getInheritanceOrder(), propID) || this.findModifierProp(propID);
      c.defs.set(propID, loc ? { obj: loc.object.getInstance(), ref: loc.object,
                                 meta: loc.prop instanceof VmNativeCode ? loc.prop : null } : null);
      return loc;
    }
    if(def === null) return undefined;
    // (The value is read each time: it may have changed.)
    return { object: def.ref, prop: def.meta || def.obj.props.get(propID) };
  }

  /**
   * Find a property in the modifiers of this object's intrinsic classes
   * (defined with 'modify List' etc.), from the most specific class to
   * the root. (These come after the native methods, which can't be
   * overridden.)
   */
  protected findModifierProp(propID: number): IPropLocation {
    if(!intrinsicClass) intrinsicClass = require('../metaimp/IntrinsicClass').IntrinsicClass;
    const IntrinsicClass = intrinsicClass;
    for(let metaclassID of this.getMetaChain()) {
      let icID = IntrinsicClass.findFor(metaclassID);
      let ic: any = icID === null ? null : Heap.getObj(icID);
      if(!ic || !ic.modifierObjID) continue;
      let loc = Heap.getObj(ic.modifierObjID).findProp(propID);
      if(loc) return loc;
    }
    return undefined;
  }

  /**
   * Find the definition of a property that 'inherited' reaches from
   * the definition on definingObjID, with this object as the target
   * object: the next definition after definingObjID in this object's
   * inheritance order.
   * @param propID Property to look for
   * @param definingObjID Object defining the currently executing code
   * @returns Property value and the object defining it, or undefined
   */
  public findInheritedProp(propID: number, definingObjID: number): IPropLocation {
    let order = this.getInheritanceOrder();
    let idx = order.indexOf(definingObjID);
    // If the defining object isn't an ancestor of this object (which can
    // happen with code attached via setMethod, for instance), fall back to
    // the defining object's own superclasses.
    if(idx == -1) {
      let defining = Heap.getObj(definingObjID);
      return defining.findPropIn(defining.getInheritanceOrder().slice(1), propID);
    }
    return this.findPropIn(order.slice(idx + 1), propID);
  }

  getValue(): any {
    return null;
  }  

  //
  // OPERATORS
  //

  negate(): VmData {
    return null;
  }

  add(data: VmData): VmData {
    return null;
  }

  subtract(data: VmData): VmData {
    return null;
  }

  multiply(data: VmData): VmData {
    return null;
  }

  divide(data: VmData): VmData {
    return null;
  }

  // Comparing two objects is done by ID, unless
  // the metaclass implementation overrides equals()
  equals(data: VmData, depth?: number): boolean {
    if(!(data instanceof VmObject)) return false;
    return this.id == data.getInstance().id;
  }

  compare(data: VmData): boolean {
    throw('CANNOT_COMPARE_TYPE');
  }

  getindex(vmIndex: VmData): VmData {
    return null;
  }

  setindex(vmIndex: VmData, data: VmData): VmData {
    return null;
  }  

  setprop(propID: number, data: VmData) {
    this.beforeChange();
    if(!this.props.has(propID)) {
      // A new property can change lookups on this object, and on objects
      // that inherit from it.
      if(Lookup.parents.has(this.id)) Lookup.invalidate();
      else (this as any)[Lookup.CACHE] = undefined;
    }
    this.props.set(propID, data);
  }

  invoke(...args: VmData[]): VmData {
    throw('CANNOT_INVOKE_TYPE');
  }

  funcinfo(): IFuncInfo {
    throw('NOT A FUNCTION');
  }

  toStr(radix?: number, isSigned?: boolean): string {
    // Is 'objToString' symbol defined?
    let vmProp = Symbols.get('objToString');
    if (vmProp != null) {
      // Does this object define this property?
      let propLocation = this.findProp(vmProp.value);
      if(propLocation) {
        // Call the property:
        let res = Vm.getInstance().runContext(propLocation.prop.value, vmProp, new VmObject(this.id), new VmObject(propLocation.object.value), new VmObject(this.id), new VmNil()).unpack();
        // Return the result if it's a string.
        if(typeof(res) == 'string') return res;
      }
    } 

    // If all else, fails, return generic conversion:
    return `object#${this.id.toString()}`;
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
    // Find the prop on this object itself. (For an intrinsic class object
    // such as String, its instances' methods are not properties of the
    // class object, so they report [0, 0, nil].)
    let propInfo = this.findProp(vmProp.value);
    // By default, we return no params, no opt params, no varying args
    // (even if the prop was not found)
    let result = [new VmInt(0), new VmInt(0), new VmNil()];
    if(propInfo)  {
      // For native code, get the param info from the VmNativeCode object.
      if(propInfo.prop instanceof VmNativeCode) {
        result = [new VmInt(propInfo.prop.params), new VmInt(propInfo.prop.optParams), propInfo.prop.varyingParams ? new VmTrue() : new VmNil()];
      }
      // For a static function, get the function info from the image.
      if(propInfo.prop instanceof VmCodeOffset) {
         let info = Vm.getInstance().getFuncInfo(propInfo.prop.value);
         result = [new VmInt(info.params), new VmInt(info.optParams), info.varargs ? new VmTrue() : new VmNil()];
      }
    }
    return new VmList(result);
  }

  /**
   * Returns a list containing the immediate superclasses of the object. 
   */
  protected metaGetSuperclassList(): VmData {
    return this.getSuperclassList();
  }

  /**
   * Returns true if the object was declared as a "class", nil otherwise. 
   * @returns true if object is class
   */
  protected metaIsClass(): VmData {
    return this.isClass() ? new VmTrue() : new VmNil();
  }

  /**
   * Returns true if the object is transient, nil otherwise. 
   * @returns true if object is transient
   */
  protected isTransient(): VmData {
    return this._isTransient ? new VmTrue() : new VmNil();
  }

  /**
   * Am I an instanceof IntrinsicClass?
   */
  protected isIntrinsicClass() {
    return false;
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
    // An object is of its own kind.
    if(obj === this) return new VmTrue();
    return obj.isAncestor(this) ? new VmTrue() : new VmNil();
  }

  /**
   * Determines whether 'inherited' in definingObj's method for prop would
   * find a definition, following the inheritance order of origTargetObj.
   * @param vmProp Property
   * @param vmOrigTarget Original target object
   * @param vmDefining Defining object
   * @param vmFlags PropDefAny (default): true or nil; PropDefGetClass:
   * the object the property would be inherited from, or nil
   */
  protected propInherited(vmProp: VmProp, vmOrigTarget: VmObject, vmDefining: VmObject, vmFlags?: VmInt): VmData {
    let flags = vmFlags ? vmFlags.unpack() : 1;
    let found = vmOrigTarget.getInstance().findInheritedProp(vmProp.unpack(), vmDefining.getInstance().id);
    if(!found) return new VmNil();
    return flags == 4 ? found.object : new VmTrue();
  }

  /**
   * Determines if the object defines or inherits the property prop.
   * @param prop Prop
   * @param flags 
   */
  protected propDefined(vmProp: VmProp, vmFlags?: VmInt): VmData {
    let flags = vmFlags ? vmFlags.unpack(): 1;
    let propID = vmProp.unpack();
    let propFound = this.findProp(propID);
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
    let propFound = this.findProp(prop.value);
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

