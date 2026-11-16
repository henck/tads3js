import { RootObject, Lookup } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmNativeCode, VmData, VmObject, VmNil, VmTrue, VmList } from '../types';
import { Heap } from '../Heap';
import { Debug } from '../Debug';

class IntrinsicClass extends RootObject {
  public metaclassIndex: number;   // index in the metaclass dependency table
  public modifierObjID: number;    // the class's modifier object (from 'modify'), or 0
  public klass: any;

  constructor(metaclassIndex: number, modifierObjID: number) {
    super();
    this.metaclassIndex = metaclassIndex;
    this.modifierObjID = modifierObjID;

    // Get the class that this IntrinsicClass represents:
    this.klass = MetaclassRegistry.getClass(this.metaclassIndex);
    if(!this.klass) {
      Debug.info(`IntrinsicClass implementation class not found: ${this.metaclassIndex}.`);
    }

    // IntrinsicClasses are classes:
    this._isClass = true;
  }

  public unpack() {
    return this.klass;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    // UINT2 data size, UINT2 metaclass index, UINT4 modifier object ID
    let metaclassIndex = image.getUInt16(offset + 2);
    let modifierObjID = image.getUInt32(offset + 4);
    return new IntrinsicClass(metaclassIndex, modifierObjID);
  }  

  public isAncestor(obj: RootObject) {
    let classes = obj.getMetaChain();
    return classes.includes(this.metaclassIndex);
  }

  /**
   * Find the IntrinsicClass object representing the given metaclass.
   * @param metaclassID Metaclass ID
   * @returns Object ID, or null if the image has no such object
   */
  public static findFor(metaclassID: number): number {
    if(IntrinsicClass.byMetaclassVersion != Lookup.version) {
      IntrinsicClass.byMetaclass = new Map();
      Heap.forEach((id, value, isIntrinsic) => {
        if(isIntrinsic) IntrinsicClass.byMetaclass.set((value as IntrinsicClass).metaclassIndex, id);
      });
      IntrinsicClass.byMetaclassVersion = Lookup.version;
    }
    let id = IntrinsicClass.byMetaclass.get(metaclassID);
    return id === undefined ? null : id;
  }

  // IntrinsicClass objects by metaclass (cached).
  private static byMetaclass: Map<number, number> = null;
  private static byMetaclassVersion = -1;

  /**
   * Get the superclasses list of this object: the intrinsic class of the
   * nearest ancestor metaclass (e.g. Vector -> [Collection], Collection ->
   * [Object]), or the empty list for Object itself. The metaclass
   * hierarchy is taken from the implementation classes' inheritance.
   */
  protected getSuperclassList(): VmData {
    if(!this.klass) return new VmList([]);
    let proto = Object.getPrototypeOf(this.klass.prototype);
    while(proto) {
      let ctor = proto.constructor;
      // metaclassID is a static field, which JS subclasses inherit, so
      // only consider classes that were registered themselves.
      if(Object.prototype.hasOwnProperty.call(ctor, 'metaclassID')) {
        let id = IntrinsicClass.findFor(ctor.metaclassID);
        if(id !== null) return new VmList([new VmObject(id)]);
      }
      proto = Object.getPrototypeOf(proto);
    }
    return new VmList([]);
  }  

  protected isIntrinsicClass() {
    return true;
  }

  public getValue() {
    return `metaclass=${MetaclassRegistry.indexToName(this.metaclassIndex)}`;
  }    

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("IntrinsicClass.isIntrinsicClass", this.metaIsIntrinsicClass, 1);
    }
    return null;
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   /**
    * Returns true if val is an IntrinsicClass object, nil if not. 
    * @param vmVal val to check
    * @returns VmTrue or VmNil
    */
   protected metaIsIntrinsicClass(vmVal: VmData): VmData {
     if(!(vmVal instanceof VmObject)) return new VmNil();
     if(vmVal.getInstance() instanceof IntrinsicClass) return new VmTrue();
     return new VmNil();
   }

}

MetaclassRegistry.register('intrinsic-class/030001', IntrinsicClass);

export { IntrinsicClass }

