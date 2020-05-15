import { VmData } from "./VmData";
import { Vm } from "../Vm";

export class VmFuncPtr extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'funcptr';
  }

  invoke(...args: VmData[]): VmData {
    return Vm.getInstance().runContext(this.value, null, ...args);
  }  
}
