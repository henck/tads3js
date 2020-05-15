import { VmData } from "./VmData";

export class VmDstring extends VmData {
  constructor(value: string) {
    super(value);
  }

  getName() {
    return 'dstring';
  }
}