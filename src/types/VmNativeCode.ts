import { VmData } from "./VmData";
import { Vm } from "../Vm";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

type TPropFunc = ((...args: any[]) => VmData);

export class VmNativeCode extends VmData {
  public funcname: string;
  public params: number;
  public optParams: number;
  public varyingParams: boolean;

  constructor(funcname: string, value: TPropFunc, params?: number, optParams?: number, varyingParams?: boolean) {
    super(value);
    this.funcname = funcname;
    this.params = params ?? 0;
    this.optParams = optParams ?? 0;
    this.varyingParams = varyingParams ?? false;
  }

  getName() {
    return 'nativecode';
  }

  getType() {
    return VmType.NATIVE_CODE;
  }  

  // Operators

  not() {
    return new VmNil();
  }    

  eq(data: VmData, depth?: number): boolean {
    return ((data instanceof VmNativeCode) && this.value == data.value);
  }    

  /*invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.value, null, ...args);
  }*/ 

  /* funcinfo(): IFuncInfo {
    return Vm.getInstance().getFuncInfo(this.value);
  }*/
}
