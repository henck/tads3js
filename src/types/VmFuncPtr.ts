import { VmData } from "./VmData";
import { Vm } from "../Vm";
import { IFuncInfo } from "../IFuncInfo";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

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

  // Operators

  not() {
    return new VmNil();
  }  

  eq(data: VmData, depth?: number): boolean {
    return ((data instanceof VmFuncPtr) && this.value == data.value);
  }    

  toStr(radix?: number, isSigned?: boolean): string {
    return `funcptr#${this.value.toString()}`;
  }   

  // ...

  invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.value, null, null, null, null, null, ...args);
  }  

  funcinfo(): IFuncInfo {
    return Vm.getInstance().getFuncInfo(this.value);
  }

}
