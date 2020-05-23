import { VmData } from "./VmData";
import { Vm } from "../Vm";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "./VmType";

type TPropFunc = ((...args: any[]) => VmData);

export class VmNativeCode extends VmData {
  constructor(value: TPropFunc) {
    super(value);
  }

  getName() {
    return 'nativecode';
  }

  getType() {
    return VmType.NATIVE_CODE;
  }  

  /*invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.value, null, ...args);
  }*/ 

  /* funcinfo(): IFuncInfo {
    return Vm.getInstance().getFuncInfo(this.value);
  }*/
}
