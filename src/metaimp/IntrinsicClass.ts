import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmNativeCode, VmData, VmObject, VmNil, VmTrue, VmList } from '../types';
import { Heap } from '../Heap';
import { Debug } from '../Debug';

class IntrinsicClass extends RootObject {
  public metaclassDependencyTableIndex: number;
  public modifierObjID: number;
  public klass: any;

  constructor(metaclassDependencyTableIndex: number, modifierObjID: number) {
    super();
    //console.log("Intrinsic class", 
    //  "metaclass index", metaclassDependencyTableIndex, 
    //  "modifier object ID", modifierObjID);
    this.metaclassDependencyTableIndex = metaclassDependencyTableIndex;
    this.modifierObjID = modifierObjID;

    // Get the class that this IntrinsicClass represents:
    this.klass = MetaclassRegistry.getClass(this.modifierObjID);
    if(!this.klass) {
      Debug.info(`IntrinsicClass implementation class not found: ${this.modifierObjID}.`);
    }

    // Modifier object ID is not the object's ID, because other objects are loaded
    // by the VM which overlap some of these IDs. It could very well be the 
    // metaclass index, though, because there are exactly 0..22 of them (same
    // as metaclasses, it seems).

    // The value 8 is metaclass root-object.

    // IntrinsicClasses are classes:
    this._isClass = true;
  }

  public unpack() {
    return this.klass;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let metaclassDependencyTableIndex = image.getUInt16(offset);
    let modifiedObjID = image.getUInt32(offset + 2);
    return new IntrinsicClass(metaclassDependencyTableIndex, modifiedObjID);
  }  

  public isAncestor(obj: RootObject) {
    let classes = obj.getMetaChain();
    return classes.includes(this.modifierObjID);
  }

  /**
   * Get the superclasses list of this object. For an IntrinsicClass,
   * this will return [Object]. For Object, this will return the
   * empty list.
   */
  protected getSuperclassList(): VmData {
    if(MetaclassRegistry.indexToName(this.modifierObjID) == 'root-object/030004') return new VmList([]);
    let objID = 0;
    Heap.forEach((id, value, isIntrinsic) =>  {
      if(isIntrinsic && MetaclassRegistry.indexToName((value as any).modifierObjID) == 'root-object/030004') objID = id;
    });
    return new VmList([new VmObject(objID)]);
  }  

  protected isIntrinsicClass() {
    return true;
  }

  public getValue() {
    return `metaclass=${MetaclassRegistry.indexToName(this.modifierObjID)}`;
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

