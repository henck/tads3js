import { VmData, VmInt, VmNil, VmTrue, VmObject } from "../../types";
import { VmRuntimeError, VmErr } from "../../VmErrors";
import { BigNumber } from "../../metaimp/BigNumber";
const Decimal = require('decimal.js');

/**
 * Parse an integer the way toInteger() does: skip leading spaces, accept a
 * '+' or '-' sign (and spaces after it), then read digits in the given
 * radix up to the first character that isn't one. 'nil' and 'true'
 * (ignoring surrounding spaces) give 0 and 1.
 * @param str Text to parse
 * @param radix Radix (2 to 36)
 * @param decimals Also accept a decimal fraction and exponent (radix 10)
 * @returns The value (not limited to the integer range)
 */
export function parseNumberText(str: string, radix: number, decimals: boolean = false): number {
  let t = str.trim();
  if(t == 'nil') return 0;
  if(t == 'true') return 1;
  let i = 0;
  let s = str;
  while(i < s.length && s[i] == ' ') i++;
  let neg = false;
  if(s[i] == '+' || s[i] == '-') {
    neg = s[i] == '-';
    i++;
    while(i < s.length && s[i] == ' ') i++;
  }
  let value = 0;
  while(i < s.length) {
    let d = parseInt(s[i], 36);
    if(isNaN(d) || d >= radix) break;
    value = value * radix + d;
    i++;
  }
  if(decimals && radix == 10) {
    let m = /^(\.\d*)?([eE][+-]?\d+)?/.exec(s.substr(i));
    if(m && m[0].length) value = parseFloat(value + m[0]);
  }
  return neg ? -value : value;
}

/** The text of a string argument, or null if it isn't a string. */
export function stringArg(val: VmData): string {
  let v = val.unpack();
  return typeof(v) == 'string' ? v : null;
}

/**
 * Convert a value to an integer: integers as is, nil/true to 0/1, and
 * strings parsed in the given radix (2 to 36, default 10). In bases 2, 8
 * and 16, an unsigned number up to 0xFFFFFFFF is accepted and returned as
 * the corresponding signed 32-bit value.
 * @throws numeric overflow (2023), string value required (2019)
 */
export function builtin_toInteger(val: VmData, vmRadix?: VmInt): VmInt {
  if(val instanceof VmInt) return val;
  if(val instanceof VmNil) return new VmInt(0);
  if(val instanceof VmTrue) return new VmInt(1);
  if(BigNumber.isBigNumber(val)) {
    // Round to the nearest integer (half to even).
    let v = BigNumber.of(val).value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
    if(v.gt(2147483647) || v.lt(-2147483648)) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
    return new VmInt(v.toNumber());
  }
  let str = stringArg(val);
  if(str === null) throw new VmRuntimeError(VmErr.STRING_VAL_REQD);

  let radix = (vmRadix instanceof VmInt) ? vmRadix.unpack() : 10;
  if(radix < 2 || radix > 36) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  let v = parseNumberText(str, radix);
  if((radix == 2 || radix == 8 || radix == 16) && v > 0x7fffffff && v <= 0xffffffff) return new VmInt(v | 0);
  if(v > 0x7fffffff || v < -0x80000000) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
  return new VmInt(v);
}

/**
 * Convert a value to a number: an integer for a whole number in the
 * integer range; otherwise (a decimal point or exponent in radix 10, or a
 * larger value) a BigNumber.
 */
export function builtin_toNumber(val: VmData, vmRadix?: VmInt): VmData {
  if(val instanceof VmInt) return val;
  if(BigNumber.isBigNumber(val)) return val;
  if(val instanceof VmNil) return new VmInt(0);
  if(val instanceof VmTrue) return new VmInt(1);
  let str = stringArg(val);
  if(str === null) throw new VmRuntimeError(VmErr.STRING_VAL_REQD);

  let radix = (vmRadix instanceof VmInt) ? vmRadix.unpack() : 10;
  if(radix < 2 || radix > 36) throw new VmRuntimeError(VmErr.BAD_VAL_BIF);
  let m = radix == 10 ? /^\s*([+-]?)\s*(\d*\.?\d*(?:[eE][+-]?\d+)?)/.exec(str) : null;
  let isFloat = m !== null && /[.eE]/.test(m[2]) && /\d/.test(m[2]);
  if(isFloat) return new VmObject(BigNumber.fromString(m[1] + m[2]));
  let v = parseNumberText(str, radix, false);
  if(v > 0x7fffffff || v < -0x80000000) {
    // A whole number too large for an integer: parse it exactly.
    let digits = str.trim().replace(/^([+-]?)\s*/, '$1');
    let d = radix == 10 ? new Decimal(digits.match(/^[+-]?\d+/)[0]) : new Decimal(v);
    return new VmObject(BigNumber.make(d, d.abs().toFixed().length));
  }
  return new VmInt(v);
}
