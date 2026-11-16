import { VmData } from "./VmData";
import { VmType } from "./VmType";
import { VmNil } from "./VmNil";

/**
 * A method set with setMethod() from an anonymous function object: the
 * property behaves as code (propType gives TypeCode), and evaluating it
 * calls the function (which keeps its own captured context, including
 * 'self'). The value is the anonymous function's VmObject.
 */
export class VmAnonMethod extends VmData {
  constructor(func: VmData) {
    super(func);
  }

  getName() {
    return 'anonmethod';
  }

  getType() {
    return VmType.CODEOFS;
  }

  not() {
    return new VmNil();
  }

  eq(data: VmData, depth?: number): boolean {
    return (data instanceof VmAnonMethod) && this.value.eq(data.value);
  }

  toStr(): string {
    return this.value.toStr();
  }
}
