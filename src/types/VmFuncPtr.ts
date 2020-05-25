import { VmData } from "./VmData";
import { Vm } from "../Vm";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "./VmType";

export class VmFuncPtr extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'funcptr';
  }

  getType() {
    return VmType.FUNCPTR;
  }  

  invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.value, null, null, ...args);
  }  

  funcinfo(): IFuncInfo {
    return Vm.getInstance().getFuncInfo(this.value);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return `funcptr#${this.value}`;
  }   
}
