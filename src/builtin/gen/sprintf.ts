import { VmData, VmInt, VmNil, VmTrue, VmObject, VmSstring } from "../../types";
import { MetaString } from "../../metaimp";
import { VmRuntimeError, VmErr } from "../../VmErrors";
import { parseNumberText } from "./toInteger";
import { BigNumber } from "../../metaimp/BigNumber";
const Decimal = require('decimal.js');

/**
 * sprintf(format, ...): format values according to a template.
 *
 * A format code is: % flags width .precision type. Flags: [n] (argument
 * number), - (left-align), + (always show sign), space (space for
 * positive), ',' (digit grouping), _x (padding character x), # (see
 * below). Types: % b c d e E f g G o r R s u x X; an unknown type leaves
 * the whole code in the output. Behaviour follows the reference VM where
 * it differs from the manual (e.g. # adds a 0x prefix for %x, and doesn't
 * zero-pad %d).
 */
export function builtin_sprintf(vmFormat: VmData, ...args: VmData[]): VmData {
  let fmt = Array.from(vmFormat.unpack() as string);
  let out = '';
  let argPos = 0;
  let i = 0;

  while(i < fmt.length) {
    let c = fmt[i++];
    if(c != '%') { out += c; continue; }

    let start = i - 1;
    let argNum: number = null;
    let left = false, plus = false, space = false, group = false, alt = false;
    let pad = ' ';
    let zeroPad = false;

    // Flags
    flags: while(i < fmt.length) {
      switch(fmt[i]) {
        case '[': {
          let close = fmt.indexOf(']', i);
          if(close < 0) break flags;
          argNum = parseInt(fmt.slice(i + 1, close).join(''));
          i = close + 1;
          continue;
        }
        case '-': left = true; i++; continue;
        case '+': plus = true; i++; continue;
        case ' ': space = true; i++; continue;
        case ',': group = true; i++; continue;
        case '#': alt = true; i++; continue;
        case '_': pad = fmt[i + 1] ?? ' '; i += 2; continue;
      }
      break;
    }

    // Width (a leading 0 means zero padding)
    let width = 0;
    if(fmt[i] == '0') { zeroPad = true; }
    while(i < fmt.length && fmt[i] >= '0' && fmt[i] <= '9') width = width * 10 + parseInt(fmt[i++]);

    // Precision
    let precision: number = null;
    if(fmt[i] == '.') {
      i++;
      precision = 0;
      while(i < fmt.length && fmt[i] >= '0' && fmt[i] <= '9') precision = precision * 10 + parseInt(fmt[i++]);
    }

    let type = fmt[i++];
    if(type == '%') { out += '%'; continue; }
    if(type === undefined || !'bcdeEfgGorRsuxX'.includes(type)) {
      // Invalid type: keep the code as it was.
      out += fmt.slice(start, i).join('');
      continue;
    }

    // Get the argument.
    let arg: VmData;
    if(argNum !== null) arg = args[argNum - 1];
    else arg = args[argPos++];
    if(arg === undefined) arg = new VmNil();

    let body: string;      // the formatted value, without sign or prefix
    let sign = '';
    let prefix = '';
    let numeric = true;

    switch(type) {
      case 's': {
        numeric = false;
        body = arg instanceof VmNil ? '' : arg.toStr();
        if(precision !== null) body = Array.from(body).slice(0, precision).join('');
        break;
      }
      case 'c': {
        numeric = false;
        let v = arg.unpack();
        body = typeof(v) == 'string' ? (Array.from(v)[0] ?? '') : String.fromCodePoint(Math.round(toNum(arg)));
        break;
      }
      case 'd': case 'u': case 'b': case 'o': case 'x': case 'X': {
        let v = roundArg(arg);
        let radix = { d: 10, u: 10, b: 2, o: 8, x: 16, X: 16 }[type];
        // Unsigned types show negative integers as their 32-bit pattern.
        if(type != 'd' && v < 0 && arg instanceof VmInt) v = v >>> 0;
        if(v < 0) { sign = '-'; v = -v; }
        body = v.toString(radix);
        if(type == 'X') body = body.toUpperCase();
        if(precision !== null) while(body.length < precision) body = '0' + body;
        if(group) body = groupDigits(body);
        if(alt) prefix = { d: '', u: '', b: '0b', o: '0', x: '0x', X: '0X' }[type];
        break;
      }
      case 'r': case 'R': {
        let v = roundArg(arg);
        if(v >= 1 && v <= 4999) {
          body = roman(v);
          if(type == 'r') body = body.toLowerCase();
        } else {
          if(v < 0) { sign = '-'; v = -v; }
          body = v.toString();
        }
        break;
      }
      case 'e': case 'E': case 'f': case 'g': case 'G': {
        let v = toNum(arg);
        if(v < 0 || Object.is(v, -0)) { sign = '-'; v = -v; }
        body = formatFloat(v, type, precision === null ? 6 : precision, alt);
        if(group) {
          let dot = body.search(/[.eE]/);
          let intPart = dot < 0 ? body : body.substr(0, dot);
          body = groupDigits(intPart) + (dot < 0 ? '' : body.substr(dot));
        }
        break;
      }
    }

    if(numeric && sign == '') sign = plus ? '+' : (space ? ' ' : '');

    // Pad to the width.
    let len = Array.from(sign + prefix + body).length;
    let padding = Math.max(0, width - len);
    if(left) out += sign + prefix + body + pad.repeat(padding);
    else if(zeroPad && numeric) out += sign + prefix + '0'.repeat(padding) + body;
    else out += pad.repeat(padding) + sign + prefix + body;
  }

  return new VmSstring(out);
}

/** An argument rounded to an integer (BigNumbers round half to even). */
function roundArg(arg: VmData): number {
  if(BigNumber.isBigNumber(arg)) return BigNumber.of(arg).value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber();
  return Math.round(toNum(arg));
}

/** The numeric value of an argument (strings are parsed, true/nil are 1/0). */
function toNum(arg: VmData): number {
  if(arg instanceof VmInt) return arg.unpack();
  if(BigNumber.isBigNumber(arg)) return BigNumber.of(arg).toNumber();
  if(arg instanceof VmTrue) return 1;
  if(arg instanceof VmNil) return 0;
  let v = arg.unpack();
  if(typeof(v) == 'string') return parseNumberText(v, 10, true);
  if(typeof(v) == 'number') return v;
  throw new VmRuntimeError(VmErr.NUM_VAL_REQD);
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function roman(n: number): string {
  const table: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
    [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for(let [v, s] of table) while(n >= v) { out += s; n -= v; }
  return out;
}

/** Exponent notation with at least three exponent digits (e.g. 1.2e+004). */
function expForm(v: number, digits: number, alt: boolean, upper: boolean): string {
  let s = v.toExponential(digits);
  let [mant, exp] = s.split('e');
  if(alt && digits == 0) mant += '.';
  let expSign = exp[0] == '-' ? '-' : '+';
  let expDigits = exp.replace(/^[+-]/, '');
  while(expDigits.length < 3) expDigits = '0' + expDigits;
  return mant + (upper ? 'E' : 'e') + expSign + expDigits;
}

function formatFloat(v: number, type: string, precision: number, alt: boolean): string {
  switch(type) {
    case 'f': {
      let s = v.toFixed(precision);
      if(alt && precision == 0) s += '.';
      return s;
    }
    case 'e': case 'E':
      return expForm(v, precision, alt, type == 'E');
    case 'g': case 'G': {
      let p = precision == 0 ? 1 : precision;
      let x = v == 0 ? 0 : Math.floor(Math.log10(Math.abs(Number(v.toPrecision(p)))));
      let s: string;
      if(x < -4 || x >= p) s = expForm(v, p - 1, alt, type == 'G');
      else {
        s = v.toFixed(Math.max(0, p - 1 - x));
        if(alt && !s.includes('.')) s += '.';
      }
      if(!alt) {
        // Remove trailing zeros after the decimal point, and a bare point.
        s = s.replace(/(\.\d*?)0+(?=$|[eE])/, '$1').replace(/\.(?=$|[eE])/, '');
      }
      return s;
    }
  }
}
