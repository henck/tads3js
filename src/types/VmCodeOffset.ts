import { VmData } from "./VmData";
import { VmType } from "./VmType";

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

  toStr(): string {
    return `codeoffsetp#${this.value}`;
  }   
}
