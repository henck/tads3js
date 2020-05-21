import { VmData } from "./VmData";

export class VmProp extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'prop';
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return `prop#${this.value}`;
  }  
}