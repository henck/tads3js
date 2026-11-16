import { VmData } from "./VmData";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

export class VmCodeOffset extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'codeofs';
  }

  getType() {
    return VmType.CODEOFS;
  }

  // Operators

  not() {
    return new VmNil();
  }  

  eq(data: VmData, depth?: number): boolean {
    return ((data instanceof VmCodeOffset) && this.value == data.value);
  }    

  toStr(): string {
    return `codeoffsetp#${this.value}`;
  }   
}
