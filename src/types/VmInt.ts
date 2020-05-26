import { VmData } from "./VmData";
import { VmTrue } from "./VmTrue";
import { VmNil } from "./VmNil";
import { VmType } from "./VmType";

export class VmInt extends VmData {
  constructor(value: number) {
    super(value);
  }

  getName() {
    return 'int';
  }

  getType() {
    return VmType.INT;
  }  

  isFalsy(): boolean {
    return this.value == 0;
  }  

  // Operators

  neg(): VmInt {
    return new VmInt(-this.value);
  }

  bnot(): VmInt {
    return new VmInt(~this.value);
  }

  add(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('NUM_VAL_REQD');
    return new VmInt(this.value + data.value);
  }

  sub(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('NUM_VAL_REQD');
    return new VmInt(this.value - data.value);
  }

  mul(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('NUM_VAL_REQD');
    return new VmInt(this.value * data.value);
  }

  band(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_BAND');
    return new VmInt(this.value & data.value);
  }

  bor(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_BOR');
    return new VmInt(this.value | data.value);
  }

  shl(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_SHL');
    return new VmInt(this.value << data.value);
  }

  ashr(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_AHSR');
    return new VmInt(this.value >> data.value);
  }  

  xor(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_XOR');
    return new VmInt(this.value ^ data.value);
  }

  lshr(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('BAD_TYPE_LHSR');
    return new VmInt(this.value >>> data.value);
  }  

  div(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('NUM_VAL_REQD');
    if(data.value == 0) throw('DIVIDE_BY_ZERO');
    return new VmInt(Math.floor(this.value/data.value));
  }

  mod(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw('NUM_VAL_REQD');
    if(data.value == 0) throw('DIVIDE_BY_ZERO');
    return new VmInt(this.value % data.value);
  }

  not() {
    return this.value == 0 ? new VmTrue() : new VmNil();
  }

  boolize() {
    return this.value == 0 ? new VmNil() : new VmTrue();
  }

  eq(data: VmData, depth?: number): boolean {
    return ((data instanceof VmInt) && this.value == data.value);
  }

  lt(data: VmData): boolean {
    if(!(data instanceof VmInt)) throw('INVALID_COMPARISON');
    return this.value < data.value; 
  }  

  toStr(radix?: number, isSigned?: boolean): string {
    radix = radix ?? 10;
    return this.value.toString(radix);
  }
}
