import { Metaclass, TPropFunc } from '../metaclass/Metaclass';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";

export class IntrinsicClass extends Metaclass {
  public metaclassDependencyTableIndex: number;
  public modifierObjID: number;

  constructor(metacmetaclassDependencyTableIndexassIndex: number, modifierObjID: number) {
    super();
    // console.log("Intrinsic class", "metaclass index", metacmetaclassDependencyTableIndexassIndex, "modifier object ID", modifierObjID);
    this.metaclassDependencyTableIndex = metacmetaclassDependencyTableIndexassIndex;
    this.modifierObjID = modifierObjID;
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    let metaclassDependencyTableIndex = image.getUInt16(offset);
    let modifiedObjID = image.getUInt32(offset + 2);
    return new IntrinsicClass(metaclassDependencyTableIndex, modifiedObjID);
  }  

  getMethodByIndex(idx: number): TPropFunc {
    console.log("Instrinsic class; looking for prop index", idx);
    switch(idx) {
      //case 0: return this.length;
    }
    return null;
  }  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

}

MetaclassRegistry.register('intrinsic-class/030001', IntrinsicClass);