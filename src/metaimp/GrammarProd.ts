import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmObject, VmNativeCode } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from "./MetaString";

class GrammarProd extends RootObject {
  private value: string;

  constructor() {
    super();
  }

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    return new GrammarProd();
    //throw('GrammarProd: Cannot load from image');
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      // case 0: return new VmNativeCode(this.getPatternString, 0);
    }
    return null;
  }

  getValue() {
    return this.value;
  }  

  /*
   * Virtual methods
   */

  toStr(radix?: number, isSigned?: boolean): string {
    return this.value;
  }   

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */
}

// If #include <gramprod.h> is not given, compiler will fall back
// to 'grammar-production/030000'. We'll assume that both versions
// are the same.
MetaclassRegistry.register('grammar-production/030000', GrammarProd);
MetaclassRegistry.register('grammar-production/030002', GrammarProd);

export { GrammarProd }