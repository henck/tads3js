import { VmData } from "./VmData";
import { VmTrue } from "./VmTrue";
import { VmNil } from "./VmNil";
import { VmType } from "./VmType";
import { VmRuntimeError, VmErr } from "../VmErrors";

// Loaded lazily (once), to avoid a circular import (BigNumber uses VmInt).
let bigNumberClass: any = null, decimalClass: any = null, vmObjectClass: any = null;
function bignum(): any { return bigNumberClass || (bigNumberClass = require('../metaimp/BigNumber').BigNumber); }
function decimal(): any { return decimalClass || (decimalClass = require('decimal.js')); }
function vmObject(): any { return vmObjectClass || (vmObjectClass = require('./VmObject').VmObject); }

/** An integer as a BigNumber with 10 digits of precision. */
function asBigNumber(v: number): VmData {
  const VmObject = vmObject();
  return new VmObject(bignum().make(new (decimal())(v), 10));
}

/**
 * A 32-bit integer value. VmInt objects are immutable (they may be shared,
 * e.g. by several variables or list elements).
 *
 * Arithmetic follows the reference VM: / truncates toward zero, % has the
 * sign of the dividend, and results that overflow 32 bits are promoted to
 * BigNumber (10 digits of precision, or 20 for multiplication). With a
 * BigNumber operand, the integer converts with 10 digits of precision.
 */
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

  /** An integer result, or a BigNumber if it doesn't fit in 32 bits. */
  private static result(v: number, precision: number): VmData {
    if(v >= -2147483648 && v <= 2147483647) return new VmInt(v);
    const BigNumber = bignum();
    const VmObject = vmObject();
    return new VmObject(BigNumber.make(new (decimal())(v), precision));
  }

  private static isBigNumber(data: VmData): boolean {
    return bignum().isBigNumber(data);
  }

  // Operators

  neg(): VmData {
    return VmInt.result(-this.value, 10);
  }

  bnot(): VmInt {
    return new VmInt(~this.value);
  }

  add(data: VmData): VmData {
    if(data instanceof VmInt) return VmInt.result(this.value + data.value, 10);
    if(VmInt.isBigNumber(data)) return asBigNumber(this.value).add(data);
    throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
  }

  sub(data: VmData): VmData {
    if(data instanceof VmInt) return VmInt.result(this.value - data.value, 10);
    if(VmInt.isBigNumber(data)) return asBigNumber(this.value).sub(data);
    throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
  }

  mul(data: VmData): VmData {
    if(data instanceof VmInt) {
      let v = this.value * data.value;
      // Beyond 2^53 a JS number isn't exact: compute with Decimal.
      if(Math.abs(v) > Number.MAX_SAFE_INTEGER) {
        const VmObject = vmObject();
        let d = new (decimal())(this.value).times(data.value);
        return new VmObject(bignum().make(d, 20));
      }
      return VmInt.result(v, 20);
    }
    if(VmInt.isBigNumber(data)) return asBigNumber(this.value).mul(data);
    throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
  }

  band(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_BAND);
    return new VmInt(this.value & data.value);
  }

  bor(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_BOR);
    return new VmInt(this.value | data.value);
  }

  // Shift counts are taken modulo 32 (as JS does).
  shl(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_SHL);
    return new VmInt(this.value << data.value);
  }

  ashr(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_ASHR);
    return new VmInt(this.value >> data.value);
  }

  xor(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_XOR);
    return new VmInt(this.value ^ data.value);
  }

  lshr(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.BAD_TYPE_LSHR);
    return new VmInt((this.value >>> data.value) | 0);
  }

  div(data: VmData): VmData {
    if(data instanceof VmInt) {
      if(data.value == 0) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
      return VmInt.result(Math.trunc(this.value / data.value), 10);
    }
    if(VmInt.isBigNumber(data)) return asBigNumber(this.value).div(data);
    throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
  }

  mod(data: VmData): VmInt {
    if(!(data instanceof VmInt)) throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
    if(data.value == 0) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
    return new VmInt((this.value % data.value) | 0);
  }

  not() {
    return this.value == 0 ? new VmTrue() : new VmNil();
  }

  boolize() {
    return this.value == 0 ? new VmNil() : new VmTrue();
  }

  eq(data: VmData, depth?: number): boolean {
    if(data instanceof VmInt) return this.value == data.value;
    if(VmInt.isBigNumber(data)) return data.eq(this);
    return false;
  }

  lt(data: VmData): boolean {
    if(data instanceof VmInt) return this.value < data.value;
    if(VmInt.isBigNumber(data)) return asBigNumber(this.value).lt(data);
    throw new VmRuntimeError(VmErr.INVALID_COMPARISON);
  }

  toStr(radix?: number, isSigned?: boolean): string {
    radix = radix ?? 10;
    return this.value.toString(radix);
  }
}
