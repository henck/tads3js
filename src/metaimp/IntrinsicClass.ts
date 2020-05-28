import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { VmNativeCode, VmData, VmObject, VmNil, VmTrue, VmList } from '../types';
import { MetaclassFactory } from '../metaclass/MetaclassFactory';
import { Heap } from '../Heap';

class IntrinsicClass extends RootObject {
  public metaclassDependencyTableIndex: number;
  public modifierObjID: number;

  constructor(metaclassDependencyTableIndex: number, modifierObjID: number) {
    super();
    //console.log("Intrinsic class", 
    //  "metaclass index", metaclassDependencyTableIndex, 
    //  "modifier object ID", modifierObjID);
    this.metaclassDependencyTableIndex = metaclassDependencyTableIndex;
    this.modifierObjID = modifierObjID;
    // Modifier object ID is not the object's ID, because other objects are loaded
    // by the VM which overlap some of these IDs. It could very well be the 
    // metaclass index, though, because there are exactly 0..22 of them (same
    // as metaclasses, it seems).

    // The value 8 is metaclass root-object.
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    let metaclassDependencyTableIndex = image.getUInt16(offset);
    let modifiedObjID = image.getUInt32(offset + 2);
    return new IntrinsicClass(metaclassDependencyTableIndex, modifiedObjID);
  }  

  protected isAncestor(obj: RootObject) {
    let classes = obj.getMetaChain();
    return classes.includes(this.modifierObjID);
  }

  /**
   * Get the superclasses list of this object. For an IntrinsicClass,
   * this will return [Object].
   */
  protected getSuperclassList(): VmData {
    let objID = 0;
    Heap.forEach((id, value, isIntrinsic) =>  {
      if(isIntrinsic && MetaclassRegistry.indexToName((value as any).modifierObjID) == 'root-object/030004') objID = id;
    });
    return new VmList([new VmObject(objID)]);
  }  

  public getValue() {
    return `metaclass=${MetaclassRegistry.indexToName(this.modifierObjID)}`;
  }    

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode(this.isIntrinsicClass, 1);
    }
    return null;
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

   // @todo: Needs implementations for ofKind, getSuperclassList WITH TESTS

   /**
    * Returns true if val is an IntrinsicClass object, nil if not. 
    * @param vmVal val to check
    * @returns VmTrue or VmNil
    */
   protected isIntrinsicClass(vmVal: VmData): VmData {
     if(!(vmVal instanceof VmObject)) return new VmNil();
     if(vmVal.getInstance() instanceof IntrinsicClass) return new VmTrue();
     return new VmNil();
   }

}

MetaclassRegistry.register('intrinsic-class/030001', IntrinsicClass);

export { IntrinsicClass }

