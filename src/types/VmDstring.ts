import { VmData } from "./VmData";
import { VmType } from "./VmType";

export class VmDstring extends VmData {
  constructor(value: string) {
    super(value);
  }

  getName() {
    return 'dstring';
  }

  getType() {
    return VmType.DSTRING;
  }
}