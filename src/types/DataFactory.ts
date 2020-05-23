import { VmType } from './VmType'
import { Pool } from '../Pool';
import { VmData, VmNil, VmTrue, VmObject, VmInt, VmSstring, VmList, VmCodeOffset, VmDstring, VmProp } from './';

export class DataFactory {
  static load(num: VmType, dataPool: Pool, offsetOrValue: number): VmData {
    switch(num) {
      case VmType.NIL: return new VmNil();
      case VmType.TRUE: return new VmTrue();
      case VmType.OBJ: return new VmObject(offsetOrValue);
      case VmType.INT: 
        // Very weird INT encoding seems to use only 24 bits:
        let val = offsetOrValue;
        if((val >> 24) == 1) val = val - 16777471;
        return new VmInt(val);
      case VmType.DSTRING: return new VmDstring(dataPool.getString(offsetOrValue));
      case VmType.SSTRING: return new VmSstring(dataPool.getString(offsetOrValue));
      case VmType.LIST: return new VmList(dataPool.getList(offsetOrValue));
      case VmType.CODEOFS: return new VmCodeOffset(offsetOrValue);
      case VmType.PROP: return new VmProp(dataPool.getUint2(offsetOrValue));
      default:
        throw('Cannot create type ' + num.toString());
    }    
  }
}