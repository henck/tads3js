import { VmType } from './VmType'
import { Pool } from '../Pool';
import { VmData, VmNil, VmTrue, VmObject, VmInt, VmSstring, VmList, VmCodeOffset, VmDstring, VmProp, VmFuncPtr, VmEmpty, VmEnum, VmBifPtr } from './';

export class DataFactory {
  static load(num: VmType, dataPool: Pool, offsetOrValue: number): VmData {
    switch(num) {
      case VmType.NIL:     return new VmNil();
      case VmType.TRUE:    return new VmTrue();
      case VmType.OBJ:     return new VmObject(offsetOrValue);
      case VmType.INT:     return new VmInt(offsetOrValue); // Oddly, there is no need to turn this into a signed int
      case VmType.DSTRING: return new VmDstring(dataPool.getString(offsetOrValue));
      case VmType.SSTRING: return new VmSstring(dataPool.getString(offsetOrValue));
      case VmType.LIST:    return new VmList(dataPool.getList(offsetOrValue));
      case VmType.CODEOFS: return new VmCodeOffset(offsetOrValue);
      case VmType.PROP:    return new VmProp(offsetOrValue & 0xffff); // only first two bytes are used, last two are arbitrary
      case VmType.FUNCPTR: return new VmFuncPtr(offsetOrValue);
      case VmType.EMPTY:   return new VmEmpty();
      case VmType.ENUM:    return new VmEnum(offsetOrValue);
      case VmType.BIFPTR:  return new VmBifPtr((offsetOrValue >> 16), (offsetOrValue & 0xffff));
      default:
        throw('Cannot create type ' + num.toString());
    }    
  }
}