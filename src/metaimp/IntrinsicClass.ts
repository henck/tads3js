import { RootObject, TPropFunc } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";

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

export { IntrinsicClass }

