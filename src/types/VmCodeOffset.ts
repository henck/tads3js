import { VmData } from "./VmData";

export class VmCodeOffset extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'codeofs';
  }
}
