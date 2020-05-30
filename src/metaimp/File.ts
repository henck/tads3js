import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmObject, VmNativeCode, VmNil } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Vm } from '../Vm';
import { Symbols } from '../Symbols';


class File extends RootObject {
  private value: number[];

  constructor(...args: any[]) {
    super();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    throw('File: Cannot load from image');
  }  

  unpack(): any {
    return this.value;
  }

  getValue(): any {
    return this.value;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return  new VmNativeCode(this.openTextFile, 2, 1);
    }
    return null;
  }  

  /*
   * Virtual methods implementation
   */
  

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  protected openTextFile(vmFilename: VmData, vmAccess: VmInt, vmCharSet: VmObject): VmData {
    throw(Symbols.get('File.FileNotFoundException'));
    return new VmNil();
  }


}

MetaclassRegistry.register('file/030003', File);

export { File }