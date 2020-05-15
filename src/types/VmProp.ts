import { VmData } from "./VmData";
import { VmNil } from "./VmNil";

export class VmProp extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'prop';
  }
}