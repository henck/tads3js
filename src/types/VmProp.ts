import { VmData } from "./VmData";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

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

  // Operators
  
  not() {
    return new VmNil();
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    return `prop#${this.value}`;
  }  
}