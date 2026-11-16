import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'

import { VmData, VmInt, VmNil, VmTrue, VmObject, VmNativeCode, VmList, VmSstring } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { MetaString } from './MetaString';
import { VmRuntimeError, VmErr } from '../VmErrors';

const Decimal = require('decimal.js');

// Guard digits used in calculations before rounding to the result precision.
const GUARD = 2;
// Precision of an integer converted to a BigNumber.
const INT_PRECISION = 32;

/** A Decimal constructor configured for the given working precision. */
function ctx(precision: number): any {
  return Decimal.clone({ precision: precision, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -9e15, toExpPos: 9e15 });
}

/** Number of significant digits in a numeric string (see the manual). */
function significantDigits(s: string): number {
  let m = /^\s*[+-]?(\d*)(?:\.(\d*))?(?:[eE][+-]?\d+)?\s*$/.exec(s);
  if(!m) return 1;
  let digits = (m[1] ?? '') + (m[2] ?? '');
  let stripped = digits.replace(/^0+/, '');
  // For a zero value, all the zeros are significant.
  if(stripped == '') return Math.max(1, digits.length);
  return stripped.length;
}

/**
 * BigNumber: an immutable decimal floating-point number with its own
 * precision (number of significant digits). Calculations give results
 * with the larger of the operands' precisions (an integer operand counts
 * as 32 digits), rounded half to even.
 */
class BigNumber extends RootObject {
  public value: any;        // a Decimal (may be NaN, +/-Infinity or -0)
  public precision: number;

  /**
   * new BigNumber(int, precision?), new BigNumber(string, precision?),
   * or new BigNumber(BigNumber, precision?)
   */
  constructor(vmVal?: VmData, vmPrecision?: VmData) {
    super();
    this.value = new Decimal(0);
    this.precision = 1;
    if(vmVal === undefined) return;
    let explicit = vmPrecision instanceof VmInt ? vmPrecision.unpack() : null;
    if(vmVal instanceof VmInt) {
      this.precision = explicit ?? INT_PRECISION;
      this.value = new Decimal(vmVal.unpack());
    } else if(BigNumber.isBigNumber(vmVal)) {
      let b = BigNumber.of(vmVal);
      this.precision = explicit ?? b.precision;
      this.value = b.value;
    } else {
      let s = vmVal.unpack();
      if(typeof(s) != 'string') throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
      this.precision = explicit ?? significantDigits(s);
      this.value = BigNumber.parse(s);
    }
    this.value = this.value.toSD(this.precision, Decimal.ROUND_HALF_EVEN);
  }

  private static parse(s: string): any {
    let t = s.trim();
    let m = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(t);
    if(!m) return new Decimal(0);
    return new Decimal(m[0].startsWith('.') || m[0].startsWith('-.') || m[0].startsWith('+.') ? m[0].replace('.', '0.') : m[0]);
  }

  /** Create a BigNumber from a Decimal, rounded to a precision. */
  static make(value: any, precision: number): BigNumber {
    let b = new BigNumber();
    b.precision = Math.max(1, precision);
    b.value = value.isFinite() ? value.toSD(b.precision, Decimal.ROUND_HALF_EVEN) : value;
    return b;
  }

  static fromString(s: string, precision?: number): BigNumber {
    return BigNumber.make(BigNumber.parse(s), precision ?? significantDigits(s));
  }

  static isBigNumber(v: VmData): boolean {
    return v instanceof VmObject && v.getInstance() instanceof BigNumber;
  }

  static of(v: VmData): BigNumber {
    return (v as VmObject).getInstance() as BigNumber;
  }

  /** An operand as a BigNumber (integers convert with 32 digits). */
  private static operand(v: VmData): BigNumber {
    if(v instanceof VmInt) return BigNumber.make(new Decimal(v.unpack()), INT_PRECISION);
    if(BigNumber.isBigNumber(v)) return BigNumber.of(v);
    throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
  }

  /**
   * Load a BigNumber constant from the image: UINT2 digit count (the
   * precision), INT2 exponent, UINT1 flags (0x01 negative, 0x06 type:
   * 0 number, 2 NaN, 4 infinity; 0x08 zero), then packed BCD digits, two
   * per byte, high nibble first. The value is 0.d1d2d3... x 10^exponent.
   */
  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let prec = image.getUInt16(offset);
    let exp = image.getInt16(offset + 2);
    let flags = image.getUInt8(offset + 4);
    let neg = (flags & 0x01) != 0;
    let type = flags & 0x06;
    if(type == 2) return BigNumber.make(new Decimal(NaN), prec);
    if(type == 4) return BigNumber.make(new Decimal(neg ? -Infinity : Infinity), prec);
    let digits = '';
    for(let i = 0; i < prec; i++) {
      let byte = image.getUInt8(offset + 5 + (i >> 1));
      digits += (i % 2 == 0 ? byte >> 4 : byte & 0x0f).toString();
    }
    let value = (flags & 0x08) ? new Decimal(neg ? '-0' : '0')
      : new Decimal((neg ? '-' : '') + '0.' + digits + 'e' + exp);
    return BigNumber.make(value, prec);
  }

  unpack(): any {
    return this;
  }

  getValue(): any {
    return this.value;
  }

  /** The value as a JS number (for sprintf and the like). */
  toNumber(): number {
    return this.value.toNumber();
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0:  return new VmNativeCode("BigNumber.formatString", this.formatString, 0, 6);
      case 1:  return new VmNativeCode("BigNumber.equalRound", this.equalRound, 1);
      case 2:  return new VmNativeCode("BigNumber.getPrecision", this.getPrecision, 0);
      case 3:  return new VmNativeCode("BigNumber.setPrecision", this.setPrecision, 1);
      case 4:  return new VmNativeCode("BigNumber.getFraction", this.getFraction, 0);
      case 5:  return new VmNativeCode("BigNumber.getWhole", this.getWhole, 0);
      case 6:  return new VmNativeCode("BigNumber.roundToDecimal", this.roundToDecimal, 1);
      case 7:  return new VmNativeCode("BigNumber.getAbs", this.getAbs, 0);
      case 8:  return new VmNativeCode("BigNumber.getCeil", this.getCeil, 0);
      case 9:  return new VmNativeCode("BigNumber.getFloor", this.getFloor, 0);
      case 10: return new VmNativeCode("BigNumber.getScale", this.getScale, 0);
      case 11: return new VmNativeCode("BigNumber.scaleTen", this.scaleTen, 1);
      case 12: return new VmNativeCode("BigNumber.negate", this.metaNegate, 0);
      case 13: return new VmNativeCode("BigNumber.copySignFrom", this.copySignFrom, 1);
      case 14: return new VmNativeCode("BigNumber.isNegative", this.isNegative, 0);
      case 15: return new VmNativeCode("BigNumber.divideBy", this.divideBy, 1);
      case 16: return new VmNativeCode("BigNumber.sine", this.sine, 0);
      case 17: return new VmNativeCode("BigNumber.cosine", this.cosine, 0);
      case 18: return new VmNativeCode("BigNumber.tangent", this.tangent, 0);
      case 19: return new VmNativeCode("BigNumber.degreesToRadians", this.degreesToRadians, 0);
      case 20: return new VmNativeCode("BigNumber.radiansToDegrees", this.radiansToDegrees, 0);
      case 21: return new VmNativeCode("BigNumber.arcsine", this.arcsine, 0);
      case 22: return new VmNativeCode("BigNumber.arccosine", this.arccosine, 0);
      case 23: return new VmNativeCode("BigNumber.arctangent", this.arctangent, 0);
      case 24: return new VmNativeCode("BigNumber.sqrt", this.sqrt, 0);
      case 25: return new VmNativeCode("BigNumber.logE", this.logE, 0);
      case 26: return new VmNativeCode("BigNumber.expE", this.expE, 0);
      case 27: return new VmNativeCode("BigNumber.log10", this.log10, 0);
      case 28: return new VmNativeCode("BigNumber.raiseToPower", this.raiseToPower, 1);
      case 29: return new VmNativeCode("BigNumber.sinh", this.sinh, 0);
      case 30: return new VmNativeCode("BigNumber.cosh", this.cosh, 0);
      case 31: return new VmNativeCode("BigNumber.tanh", this.tanh, 0);
      case 32: return new VmNativeCode("BigNumber.getPi", this.getPi, 1);
      case 33: return new VmNativeCode("BigNumber.getE", this.getE, 1);
      case 34: return new VmNativeCode("BigNumber.numType", this.numType, 0);
    }
    return null;
  }

  /*
   * Helpers
   */

  private wrap(value: any, precision?: number): VmData {
    return new VmObject(BigNumber.make(value, precision ?? this.precision));
  }

  /** Apply a function of the value at working precision, round to our precision. */
  private calc(f: (D: any, v: any) => any): VmData {
    let D = ctx(this.precision + GUARD + 3);
    let r = f(D, new D(this.value));
    if(!r.isFinite()) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.wrap(r);
  }

  /** Binary arithmetic: result precision is the larger of the two. */
  private binary(data: VmData, f: (D: any, a: any, b: any) => any): VmData {
    let other = BigNumber.operand(data);
    let prec = Math.max(this.precision, other.precision);
    let D = ctx(prec + GUARD);
    return this.wrap(f(D, new D(this.value), new D(other.value)), prec);
  }

  /*
   * Virtual methods (operators)
   */

  negate(): VmData {
    return this.wrap(this.value.neg());
  }

  add(data: VmData): VmData {
    return this.binary(data, (D, a, b) => a.plus(b));
  }

  subtract(data: VmData): VmData {
    return this.binary(data, (D, a, b) => a.minus(b));
  }

  multiply(data: VmData): VmData {
    return this.binary(data, (D, a, b) => a.times(b));
  }

  divide(data: VmData): VmData {
    let other = BigNumber.operand(data);
    if(other.value.isZero()) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
    return this.binary(data, (D, a, b) => a.div(b));
  }

  equals(data: VmData, depth?: number): boolean {
    if(!(data instanceof VmInt) && !BigNumber.isBigNumber(data)) return false;
    return this.value.eq(BigNumber.operand(data).value);
  }

  compare(data: VmData): boolean {
    if(!(data instanceof VmInt) && !BigNumber.isBigNumber(data)) throw new VmRuntimeError(VmErr.INVALID_COMPARISON);
    return this.value.lt(BigNumber.operand(data).value);
  }

  /** Default string form: plain notation, no leading zero, no trailing zeros. */
  toStr(radix?: number, isSigned?: boolean): string {
    if(this.value.isNaN()) return '*NAN*';
    if(!this.value.isFinite()) return this.value.isNeg() ? '-*INF*' : '*INF*';
    // A whole number can be shown in another radix.
    if(radix && radix != 10 && this.value.isInteger()) {
      let n = this.value.abs();
      let s = '';
      do {
        let d = n.mod(radix).toNumber();
        s = d.toString(radix).toUpperCase() + s;
        n = n.div(radix).floor();
      } while(n.gt(0));
      return (this.value.isNeg() && !this.value.isZero() ? '-' : '') + s;
    }
    let s = this.value.abs().toFixed();
    if(s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if(s.startsWith('0.')) s = s.substr(1);
    return (this.value.isNeg() && !this.value.isZero() ? '-' : '') + s;
  }

  /*
   * Meta methods
   */

  private formatString(vmMaxDigits?: VmData, vmFlags?: VmData, vmWholePlaces?: VmData, vmFracDigits?: VmData,
                       vmExpDigits?: VmData, vmLeadFiller?: VmData): VmData {
    let num = (v: VmData) => (v instanceof VmInt && v.unpack() >= 0) ? v.unpack() : null;
    let flags = vmFlags instanceof VmInt ? vmFlags.unpack() : 0;
    let filler = vmLeadFiller && !(vmLeadFiller instanceof VmNil) ? vmLeadFiller.toStr() : ' ';
    return new VmSstring(formatBigNumber(this.value, this.precision, num(vmMaxDigits), flags,
      num(vmWholePlaces), num(vmFracDigits), num(vmExpDigits), filler));
  }

  /** Equal after rounding the more precise value to the other's precision. */
  private equalRound(vmNum: VmData): VmData {
    let other = BigNumber.operand(vmNum);
    let prec = Math.min(this.precision, other.precision);
    let a = this.value.toSD(prec, Decimal.ROUND_HALF_EVEN);
    let b = other.value.toSD(prec, Decimal.ROUND_HALF_EVEN);
    return a.eq(b) ? new VmTrue() : new VmNil();
  }

  private getPrecision(): VmInt {
    return new VmInt(this.precision);
  }

  private setPrecision(vmDigits: VmInt): VmData {
    return this.wrap(this.value, vmDigits.unpack());
  }

  private getFraction(): VmData {
    return this.wrap(this.value.minus(this.value.trunc()));
  }

  private getWhole(): VmData {
    return this.wrap(this.value.trunc());
  }

  /** Round to a number of decimal places (negative: powers of ten). */
  private roundToDecimal(vmPlaces: VmInt): VmData {
    let places = vmPlaces.unpack();
    let scale = new Decimal(10).pow(places);
    let D = ctx(this.precision + Math.abs(places) + GUARD + 10);
    let r = new D(this.value).times(scale).toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).div(scale);
    return this.wrap(r);
  }

  private getAbs(): VmData {
    return this.wrap(this.value.abs());
  }

  private getCeil(): VmData {
    return this.wrap(this.value.ceil());
  }

  private getFloor(): VmData {
    return this.wrap(this.value.floor());
  }

  /** Number of digits before the decimal point (see the manual); 1 for zero. */
  private getScale(): VmInt {
    if(this.value.isZero()) return new VmInt(1);
    return new VmInt(Math.floor(Math.log10(Math.abs(this.value.toNumber()))) + 1 + this.scaleCorrection());
  }

  // Guard against floating-point error in log10 for exact powers of ten.
  private scaleCorrection(): number {
    let e = this.value.abs();
    let guess = Math.floor(Math.log10(e.toNumber())) + 1;
    let lo = new Decimal(10).pow(guess - 1);
    if(e.lt(lo)) return -1;
    if(e.gte(lo.times(10))) return 1;
    return 0;
  }

  private scaleTen(vmX: VmInt): VmData {
    return this.wrap(this.value.times(new Decimal(10).pow(vmX.unpack())));
  }

  private metaNegate(): VmData {
    return this.negate();
  }

  private copySignFrom(vmX: VmData): VmData {
    let neg = BigNumber.operand(vmX).value.isNeg();
    return this.wrap(neg ? this.value.abs().neg() : this.value.abs());
  }

  private isNegative(): VmData {
    return this.value.isNeg() && !this.value.isZero() ? new VmTrue() : new VmNil();
  }

  /**
   * Integer quotient (truncated to the result precision) and remainder,
   * so that dividend = quotient * divisor + remainder.
   */
  private divideBy(vmX: VmData): VmData {
    let other = BigNumber.operand(vmX);
    if(other.value.isZero()) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
    let prec = Math.max(this.precision, other.precision);
    let D = ctx(prec + this.value.e - other.value.e + GUARD + 10);
    let q = new D(this.value).div(other.value).trunc().toSD(prec, Decimal.ROUND_DOWN);
    let r = new D(this.value).minus(q.times(other.value));
    return new VmList([new VmObject(BigNumber.make(q, prec)), new VmObject(BigNumber.make(r, prec))]);
  }

  private sine(): VmData { return this.calc((D, v) => v.sin()); }
  private cosine(): VmData { return this.calc((D, v) => v.cos()); }

  private tangent(): VmData {
    return this.calc((D, v) => {
      if(v.cos().isZero()) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
      return v.tan();
    });
  }

  private degreesToRadians(): VmData { return this.calc((D, v) => v.times(D.acos(-1)).div(180)); }
  private radiansToDegrees(): VmData { return this.calc((D, v) => v.times(180).div(D.acos(-1))); }

  private arcsine(): VmData {
    if(this.value.abs().gt(1)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.calc((D, v) => v.asin());
  }

  private arccosine(): VmData {
    if(this.value.abs().gt(1)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.calc((D, v) => v.acos());
  }

  private arctangent(): VmData { return this.calc((D, v) => v.atan()); }

  private sqrt(): VmData {
    if(this.value.isNeg() && !this.value.isZero()) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.calc((D, v) => v.sqrt());
  }

  private logE(): VmData {
    if(this.value.lte(0)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.calc((D, v) => v.ln());
  }

  private log10(): VmData {
    if(this.value.lte(0)) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    return this.calc((D, v) => v.log(10));
  }

  private expE(): VmData { return this.calc((D, v) => v.exp()); }

  private raiseToPower(vmY: VmData): VmData {
    let y = BigNumber.operand(vmY);
    let yv = y.value;
    if(this.value.isNeg() && !yv.isInteger()) throw new VmRuntimeError(VmErr.VALUE_OUT_OF_RANGE);
    if(this.value.isZero() && yv.isNeg()) throw new VmRuntimeError(VmErr.DIVIDE_BY_ZERO);
    // An integer exponent doesn't raise the result's precision.
    let prec = vmY instanceof VmInt ? this.precision : Math.max(this.precision, y.precision);
    let D = ctx(prec + GUARD + 3);
    return this.wrap(new D(this.value).pow(yv), prec);
  }

  private sinh(): VmData { return this.calc((D, v) => v.sinh()); }
  private cosh(): VmData { return this.calc((D, v) => v.cosh()); }
  private tanh(): VmData { return this.calc((D, v) => v.tanh()); }

  /** BigNumber.getPi(digits) */
  private getPi(vmDigits: VmInt): VmData {
    let digits = vmDigits.unpack();
    return new VmObject(BigNumber.make(ctx(digits + GUARD + 3).acos(-1), digits));
  }

  /** BigNumber.getE(digits) */
  private getE(vmDigits: VmInt): VmData {
    let digits = vmDigits.unpack();
    return new VmObject(BigNumber.make(ctx(digits + GUARD + 3).exp(1), digits));
  }

  /** NumTypeXxx flags. */
  private numType(): VmInt {
    let v = this.value;
    if(v.isNaN()) return new VmInt(0x0002);
    if(!v.isFinite()) return new VmInt(v.isNeg() ? 0x0008 : 0x0004);
    if(v.isZero()) return new VmInt(0x0001 | (v.isNeg() ? 0x0020 : 0x0010));
    return new VmInt(0x0001);
  }
}

// ---------------------------------------------------------------------------
// formatString
// ---------------------------------------------------------------------------

const BignumSign = 0x0001, BignumExp = 0x0002, BignumExpSign = 0x0004, BignumLeadingZero = 0x0008,
  BignumPoint = 0x0010, BignumCommas = 0x0020, BignumPosSpace = 0x0040, BignumEuroStyle = 0x0080,
  BignumCompact = 0x0100, BignumMaxSigDigits = 0x0200, BignumKeepTrailingZeros = 0x0400;

/**
 * Format a value as BigNumber.formatString() does (see the manual).
 */
export function formatBigNumber(value: any, precision: number, maxDigits: number, flags: number,
                                wholePlaces: number, fracDigits: number, expDigits: number, filler: string): string {
  if(value.isNaN()) return '*NAN*';
  if(!value.isFinite()) return value.isNeg() ? '-*INF*' : '*INF*';

  let neg = value.isNeg() && !value.isZero();
  let abs = value.abs();
  let pointChar = (flags & BignumEuroStyle) ? ',' : '.';
  let groupChar = (flags & BignumEuroStyle) ? '.' : ',';
  // Decimal exponent: abs = d.ddd x 10^exp
  let exp = abs.isZero() ? 0 : abs.e;

  // Decide between plain and exponential notation.
  let useExp = (flags & BignumExp) != 0;
  if(!useExp && (flags & BignumCompact) && !abs.isZero()) {
    if(exp < -4 || (maxDigits !== null && exp >= maxDigits)) useExp = true;
  }
  if(!useExp && maxDigits !== null && exp + 1 > maxDigits) useExp = true;

  let intPart: string, fracPart: string;
  let expText = '';

  if(useExp) {
    // Mantissa digits: limited by maxDigits (total) and fracDigits.
    let mantDigits = maxDigits !== null ? Math.max(1, maxDigits) : precision;
    let m = abs.isZero() ? new Decimal(0) : abs.div(new Decimal(10).pow(exp));
    let dp = fracDigits !== null ? fracDigits : mantDigits - 1;
    let ms = m.toFixed(dp, Decimal.ROUND_HALF_EVEN);
    // Rounding may carry to 10.0
    if(ms.startsWith('10')) { exp++; ms = m.div(10).toFixed(dp, Decimal.ROUND_HALF_EVEN); }
    [intPart, fracPart] = ms.split('.');
    fracPart = fracPart ?? '';
    if(fracDigits === null && !((flags & BignumKeepTrailingZeros) && maxDigits !== null)) fracPart = fracPart.replace(/0+$/, '');
    let es = Math.abs(exp).toString();
    if(expDigits !== null) while(es.length < expDigits) es = '0' + es;
    expText = 'e' + (exp < 0 ? '-' : ((flags & BignumExpSign) ? '+' : '')) + es;
  } else {
    let dp: number;
    if(fracDigits !== null) dp = fracDigits;
    else if(maxDigits !== null) {
      let wholeDigits = Math.max(0, exp + 1);
      dp = Math.max(0, maxDigits - wholeDigits);
      if((flags & BignumMaxSigDigits) && exp < 0) dp = maxDigits - exp - 1;
    } else {
      dp = Math.max(0, precision - exp - 1);
    }
    let s = abs.toFixed(dp, Decimal.ROUND_HALF_EVEN);
    [intPart, fracPart] = s.split('.');
    fracPart = fracPart ?? '';
    if(fracDigits === null && !((flags & BignumKeepTrailingZeros) && maxDigits !== null)) fracPart = fracPart.replace(/0+$/, '');
    if(intPart == '0' && !(flags & BignumLeadingZero)) intPart = '';
    if((flags & BignumCommas) && intPart.length > 3) intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupChar);
  }

  let body = intPart + (fracPart.length || (flags & BignumPoint) ? pointChar + fracPart : '') + expText;
  let sign = neg ? '-' : ((flags & BignumSign) ? '+' : ((flags & BignumPosSpace) ? ' ' : ''));

  // Pad the whole part to wholePlaces with the filler (repeated).
  let pad = '';
  if(wholePlaces !== null && intPart.length < wholePlaces) {
    let n = wholePlaces - intPart.length;
    for(let i = 0; i < n; i++) pad += filler[i % filler.length];
  }
  return pad + sign + body;
}

MetaclassRegistry.register('bignumber/030001', BigNumber);
// BigNumber constants in the image use this name.
MetaclassRegistry.register('bignumber/000000', BigNumber);

export { BigNumber }
