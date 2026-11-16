import { VmData } from "./VmData";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

export class VmEnum extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'enum';
  }

  getType() {
    return VmType.ENUM;
  }  

  isFalsy(): boolean {
    return this.value == 0;
  }  

  // Operators

  not() {
    return new VmNil();
  }  

  eq(data: VmData, depth?: number): boolean { 
    return ((data instanceof VmEnum) && this.value == data.value);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return `enum#${this.value.toString()}`;
  }
}
