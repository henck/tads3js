import { VmData } from "./VmData";
import { VmTrue } from "./VmTrue";

export class VmNil extends VmData {
  constructor() {
    super(null);
  }

  getName() {
    return 'nil';
  }

  isFalsy(): boolean {
    return true;
  }    

  not(): VmData {
    return new VmTrue();
  }

  boolize() {
    return new VmNil();
  }

  eq(data: VmData): boolean {
    return data instanceof VmNil;
  }
}
