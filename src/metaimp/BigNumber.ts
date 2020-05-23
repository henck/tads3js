import { RootObject, TPropFunc } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { SourceImage } from '../SourceImage'
import { Pool } from '../Pool';
import { VmObject } from '../types';

type TNumber = 'num' | 'nan' | 'infinity';

class BigNumber extends RootObject
{
  private digits: number[];
  private exponent: number;
  private negative: boolean;
  private type: TNumber;
  private zero: boolean;

  constructor(digits?: number[], exponent?: number, negative?: boolean, type?: TNumber, zero?: boolean) {
    super();
    this.digits = digits ?? [];
    this.exponent = exponent ?? 0;
    this.negative = negative ?? false;
    this.type = type ?? 'num';
    this.zero = zero ?? true;
  } 

  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number) {
    // Read num digits, exponent:
    let numdigits = image.getUInt16(offset);
    let exponent = image.getInt16(offset + 2);

    // Read flags:
    let flags = image.getUInt8(offset + 4);
    let negative = (flags & 0x01) != 0;
    let type: TNumber = 'num';
    if((flags & 0x06) == 2) type = 'nan';
    if((flags & 0x06) == 4) type = 'infinity';
    let zero = (flags & 0x08) != 0;

    // Read digits:
    offset += 5;
    let digits = [];
    let byte = 0;
    for(let i = 0; i < numdigits; i ++) {
      if(i % 2 == 0) byte = image.getUInt8(offset++);
      let msb = (byte >> 4);
      let lsb = (byte & 0x0f);
      let val = (i % 2 == 0) ? msb : lsb;
      digits.push(val);
    }

    return new BigNumber(digits, exponent, negative, type, zero);
  }

  getMethodByIndex(idx: number): TPropFunc {
    switch(idx) {
      case 7: return this.getAbs;
    }
    return null;
  }  

  clone() {
    return new BigNumber(this.digits, this.exponent, this.negative, this.type, this.zero);
  }

  /*
   * Virtual methods implementation
   */
    

  /*
   * Meta methods - all private as they should not be called
   * directly by other code, only when a property is evaluated.
   */

  private getAbs(): VmObject {
    let res = this.clone();
    res.negative = false;
    return new VmObject(res);
  }
}

MetaclassRegistry.register('bignumber/030001', BigNumber);

export { BigNumber }