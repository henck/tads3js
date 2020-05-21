import { VmData } from "./VmData";
import { VmNil } from "./VmNil";

export class VmTrue extends VmData {
  constructor() {
    super(null);
  }

  getName() {
    return 'true';
  }

  not() {
    return new VmNil();
  }

  boolize() {
    return new VmTrue();
  }

  eq(data: VmData): boolean {
    return (data instanceof VmTrue);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    return 'true';
  } 
}
