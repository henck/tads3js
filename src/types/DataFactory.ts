import { VmType } from './VmType'
import { Pool } from '../Pool';
import { VmData, VmNil, VmTrue, VmObject, VmInt, VmSstring, VmList, VmCodeOffset } from './';
import { VmProp } from './VmProp';
import { VmDstring } from './VmDstring';

export class DataFactory {
  static load(num: VmType, dataPool: Pool, offset: number): VmData {
    switch(num) {
      case VmType.NIL: return new VmNil();
      case VmType.TRUE: return new VmTrue();
      case VmType.OBJ: return new VmObject(dataPool.getUint4(offset));
      case VmType.INT: 
        // Very weird INT encoding seems to use only 24 bits:
        let val = offset;
        if((val >> 24) == 1) val = val - 16777471;
        return new VmInt(val);
      case VmType.DSTRING: return new VmDstring(dataPool.getString(offset));
      case VmType.SSTRING: return new VmSstring(dataPool.getString(offset));
      case VmType.LIST: return new VmList(dataPool.getList(offset));
      case VmType.CODEOFS: return new VmCodeOffset(offset);
      case VmType.PROP: return new VmProp(dataPool.getUint2(offset));
      default:
        throw('Cannot create type ' + num.toString());
    }    
  }
}