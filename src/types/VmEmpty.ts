import { VmData } from "./VmData";
import { VmType } from "./VmType";

export class VmEmpty extends VmData {
  constructor() {
    super(null);
  }

  getName() {
    return 'empty';
  }

  getType() {
    return VmType.EMPTY;
  }  
}
