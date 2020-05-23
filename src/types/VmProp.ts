import { VmData } from "./VmData";
import { VmType } from "./VmType";

export class VmProp extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'prop';
  }

  getType() {
    return VmType.PROP;
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    return `prop#${this.value}`;
  }  
}