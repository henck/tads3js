/**
 * The TADS byte packer: packBytes()/unpackBytes() for String, ByteArray
 * and File (see "Byte Packing" in the System Manual).
 *
 * Format strings are made of items: a type code with qualifiers, a group
 * in ( ) or [ ], a literal "text" or {hex}, optionally with a count
 * prefix (e.g. 'C/a'). Spaces are ignored.
 *
 * Not implemented yet: the types that need BigNumber values (d, f, and
 * unpacking L, q, Q without the ~ qualifier, or with values outside the
 * integer range).
 */
import { VmData, VmInt, VmNil, VmTrue, VmObject, VmList, VmSstring } from "../types";
import { VmRuntimeError, VmErr } from "../VmErrors";
import { BigNumber } from "../metaimp/BigNumber";
const Decimal = require('decimal.js');

const ERR_READ = 101;     // error reading file (past the end of the source)
const ERR_WRITE = 102;    // error writing file (past the end of a ByteArray)
const ERR_SYNTAX = 107;   // format string parsing error
const ERR_TYPE = 108;     // argument type mismatch
const ERR_ARGS = 109;     // wrong number of arguments

/** Packed sizes of the fixed-size types. */
const SIZES: { [t: string]: number } = { c: 1, C: 1, s: 2, S: 2, l: 4, L: 4, q: 8, Q: 8, f: 4, d: 8 };

interface IItem {
  type: string;            // type code, '(' or '[' for groups, '"' for literals
  count: number | null;    // repeat count / length; null if not given
  star: boolean;           // '*' qualifier
  nullTerm: boolean;       // '0' qualifier
  bang: boolean;           // '!' qualifier
  query: boolean;          // '?' qualifier
  bigEndian: boolean | null;
  tilde: boolean;
  truncate: boolean;       // '%'
  items?: IItem[];         // group contents
  literal?: number[];      // literal bytes
  prefix?: IItem;          // count prefix item (for 'C/...')
}

// ---------------------------------------------------------------------------
// Format parser
// ---------------------------------------------------------------------------

class FormatParser {
  private pos = 0;
  constructor(private s: string[]) {}

  parse(): IItem[] {
    let items = this.items();
    if(this.pos < this.s.length) this.error();
    return items;
  }

  private error(): never { throw new VmRuntimeError(ERR_SYNTAX); }

  private skipSpace() { while(this.s[this.pos] == ' ') this.pos++; }

  private items(close?: string): IItem[] {
    let items: IItem[] = [];
    while(true) {
      this.skipSpace();
      if(this.pos >= this.s.length || this.s[this.pos] == close) break;
      if(this.s[this.pos] == ')' || this.s[this.pos] == ']') this.error();
      let item = this.item();
      // Count prefix: item '/' item
      this.skipSpace();
      if(this.s[this.pos] == '/') {
        this.pos++;
        this.skipSpace();
        let repeated = this.item();
        repeated.prefix = item;
        item = repeated;
      }
      items.push(item);
    }
    return items;
  }

  private item(): IItem {
    let c = this.s[this.pos++];
    let item: IItem = { type: c, count: null, star: false, nullTerm: false, bang: false,
      query: false, bigEndian: null, tilde: false, truncate: false };
    if(c == '(' || c == '[') {
      item.items = this.items(c == '(' ? ')' : ']');
      if(this.s[this.pos++] != (c == '(' ? ')' : ']')) this.error();
    } else if(c == '"') {
      let bytes: number[] = [];
      while(true) {
        if(this.pos >= this.s.length) this.error();
        let ch = this.s[this.pos++];
        if(ch == '"') {
          if(this.s[this.pos] == '"') { this.pos++; bytes.push(34); continue; }
          break;
        }
        bytes.push(ch.charCodeAt(0));
      }
      item.literal = bytes;
    } else if(c == '{') {
      let hex = '';
      while(this.pos < this.s.length && this.s[this.pos] != '}') hex += this.s[this.pos++];
      if(this.s[this.pos++] != '}') this.error();
      hex = hex.replace(/\s/g, '');
      item.literal = [];
      for(let i = 0; i + 1 < hex.length; i += 2) item.literal.push(parseInt(hex.substr(i, 2), 16));
    } else if(!'aAbcCdfhHkLlqQsSuUwWxX@'.includes(c)) {
      this.error();
    }
    this.qualifiers(item);
    return item;
  }

  private qualifiers(item: IItem) {
    while(this.pos < this.s.length) {
      let c = this.s[this.pos];
      if(c >= '0' && c <= '9') {
        // A leading 0 on a string type means null termination.
        if(c == '0' && item.count === null && !item.nullTerm && 'auwhH'.includes(item.type)) {
          item.nullTerm = true;
          this.pos++;
          continue;
        }
        let n = 0;
        while(this.s[this.pos] >= '0' && this.s[this.pos] <= '9') n = n * 10 + parseInt(this.s[this.pos++]);
        item.count = n;
      }
      else if(c == '*') { item.star = true; this.pos++; }
      else if(c == ':') {
        let t = this.s[this.pos + 1];
        if(!SIZES[t]) this.error();
        item.count = SIZES[t];
        this.pos += 2;
      }
      else if(c == '!') { item.bang = true; this.pos++; }
      else if(c == '?') { item.query = true; this.pos++; }
      else if(c == '>') { item.bigEndian = true; this.pos++; }
      else if(c == '<') { item.bigEndian = false; this.pos++; }
      else if(c == '~') { item.tilde = true; this.pos++; }
      else if(c == '%') { item.truncate = true; this.pos++; }
      else break;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IInherited { bigEndian: boolean; tilde: boolean; truncate: boolean; }

function inherit(item: IItem, ctx: IInherited): IInherited {
  return {
    bigEndian: item.bigEndian ?? ctx.bigEndian,
    tilde: item.tilde || ctx.tilde,
    truncate: item.truncate || ctx.truncate,
  };
}

function intBytes(v: number, size: number, bigEndian: boolean): number[] {
  let bytes: number[] = [];
  // Work with a two's complement representation of up to 64 bits.
  let lo = v % 0x100000000;
  let hi = Math.floor(v / 0x100000000);
  for(let i = 0; i < size; i++) {
    let word = i < 4 ? lo : hi;
    bytes.push(((word >>> ((i % 4) * 8)) & 0xff) >>> 0);
  }
  return bigEndian ? bytes.reverse() : bytes;
}

function readInt(bytes: number[], signed: boolean, bigEndian: boolean): number {
  let b = bigEndian ? bytes.slice().reverse() : bytes;
  let v = 0;
  for(let i = b.length - 1; i >= 0; i--) v = v * 256 + b[i];
  if(signed && b[b.length - 1] >= 0x80) v -= Math.pow(2, 8 * b.length);
  return v;
}

const LIMITS: { [t: string]: [number, number] } = {
  c: [-128, 127], C: [0, 255], s: [-32768, 32767], S: [0, 65535],
  l: [-2147483648, 2147483647], L: [0, 4294967295],
  q: [-9223372036854775808, 9223372036854775807], Q: [0, 18446744073709551615],
};

function utf8(str: string): number[] {
  let out: number[] = [];
  for(let ch of Array.from(str)) {
    let cp = ch.codePointAt(0);
    if(cp < 0x80) out.push(cp);
    else if(cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if(cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return out;
}

function fromUtf8(bytes: number[]): string {
  let out = '';
  for(let i = 0; i < bytes.length;) {
    let b = bytes[i];
    let n = b < 0x80 ? 0 : b < 0xe0 ? 1 : b < 0xf0 ? 2 : 3;
    let cp = n == 0 ? b : b & (0x3f >> n);
    for(let k = 1; k <= n; k++) cp = (cp << 6) | ((bytes[i + k] ?? 0) & 0x3f);
    out += String.fromCodePoint(cp);
    i += n + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Packing
// ---------------------------------------------------------------------------

/**
 * Supplies the bytes for ByteArray contents: an interface so that the
 * packer doesn't depend on the ByteArray class.
 */
export interface IByteSource {
  bytes(): number[];
  make(bytes: number[]): VmData;   // create a ByteArray value
}

export class BytePacker {
  constructor(private byteArrays: IByteSource) {}

  /**
   * Pack values into bytes.
   * @param format Format string
   * @param args Values to pack
   * @returns The packed bytes
   */
  pack(format: string, args: VmData[]): number[] {
    let items = new FormatParser(Array.from(format)).parse();
    let out: number[] = [];
    let state = { pos: 0, args: args, argPos: 0 };
    this.packItems(items, out, state, 0, { bigEndian: false, tilde: false, truncate: false });
    if(state.argPos < args.length) throw new VmRuntimeError(ERR_ARGS);
    return out;
  }

  private nextArg(state: { args: VmData[], argPos: number }): VmData {
    if(state.argPos >= state.args.length) throw new VmRuntimeError(ERR_ARGS);
    return state.args[state.argPos++];
  }

  private write(out: number[], state: { pos: number }, bytes: number[]) {
    for(let b of bytes) out[state.pos++] = b;
    for(let i = 0; i < out.length; i++) if(out[i] === undefined) out[i] = 0;
  }

  private packItems(items: IItem[], out: number[], state: any, groupStart: number, ctx: IInherited) {
    for(let item of items) this.packItem(item, out, state, groupStart, inherit(item, ctx));
  }

  private packItem(item: IItem, out: number[], state: any, groupStart: number, ctx: IInherited) {
    // Count prefix: pack the count, then the item with that count.
    if(item.prefix) {
      let count = this.prefixCount(item, state);
      let pctx = inherit(item.prefix, ctx);
      this.packValue(item.prefix, out, state, new VmInt(count), pctx);
      this.packItem({ ...item, prefix: undefined, count: count, star: false }, out, state, groupStart, ctx);
      return;
    }

    switch(item.type) {
      case '"': case '{':
        this.write(out, state, item.literal);
        return;
      case 'x':
        if(item.bang) {
          let align = item.count ?? 1;
          while(state.pos % align != 0) this.write(out, state, [0]);
        } else {
          this.write(out, state, new Array(item.count ?? 1).fill(0));
        }
        return;
      case 'X': {
        let n = item.count ?? 1;
        if(item.bang) { let a = n; n = state.pos % a; }
        state.pos = Math.max(0, state.pos - n);
        return;
      }
      case '@': {
        if(item.query) return;
        let target = (item.bang ? 0 : groupStart) + (item.count ?? 0);
        while(state.pos < target) this.write(out, state, [0]);
        state.pos = target;
        return;
      }
      case '(': case '[': {
        // [ ]: values come from a list argument (or, with !, one list per
        // iteration).
        let reps = item.star ? Infinity : (item.count ?? 1);
        if(item.type == '[' && !item.bang) {
          let list = this.listArg(this.nextArg(state));
          let sub = { pos: state.pos, args: list, argPos: 0 };
          for(let r = 0; r < reps && (reps != Infinity || sub.argPos < list.length); r++) {
            this.packItems(item.items, out, sub, sub.pos, ctx);
          }
          state.pos = sub.pos;
        } else {
          for(let r = 0; r < reps; r++) {
            if(reps == Infinity && state.argPos >= state.args.length) break;
            if(item.type == '[') {
              let list = this.listArg(this.nextArg(state));
              let sub = { pos: state.pos, args: list, argPos: 0 };
              this.packItems(item.items, out, sub, sub.pos, ctx);
              state.pos = sub.pos;
            } else {
              this.packItems(item.items, out, state, state.pos, ctx);
            }
          }
        }
        return;
      }
    }

    if('aAbuUwWhH'.includes(item.type)) {
      this.packString(item, out, state, this.nextArg(state), ctx);
      return;
    }

    // Numeric types: repeat count, or * for all remaining arguments.
    let reps = item.star ? state.args.length - state.argPos : (item.count ?? 1);
    for(let r = 0; r < reps; r++) this.packValue(item, out, state, this.nextArg(state), ctx);
  }

  /** The count to pack for an item with a count prefix. */
  private prefixCount(item: IItem, state: any): number {
    if('aAbuUwWhH'.includes(item.type)) {
      let v = state.args[state.argPos];
      if(v === undefined) throw new VmRuntimeError(ERR_ARGS);
      return this.stringUnits(item, v);
    }
    if(item.type == '[' && !item.bang) {
      return 1;
    }
    // Repeat the item for all remaining arguments.
    return state.args.length - state.argPos;
  }

  private listArg(v: VmData): VmData[] {
    let arr = v.unpack();
    if(!Array.isArray(arr)) throw new VmRuntimeError(ERR_TYPE);
    return arr;
  }

  /** The length of a string argument in the item's units. */
  private stringUnits(item: IItem, v: VmData): number {
    if(item.type == 'b') return this.byteArg(v, item).length;
    let str = this.strArg(v);
    if(item.type == 'u' || item.type == 'U') return utf8(str).length;
    if(item.type == 'h' || item.type == 'H') return str.length;
    return Array.from(str).length;
  }

  private strArg(v: VmData): string {
    if(v instanceof VmNil) return '';
    let s = v.unpack();
    if(typeof(s) == 'string') return s;
    return v.toStr();
  }

  private byteArg(v: VmData, item: IItem, truncate = false): number[] {
    let raw = v instanceof VmObject ? v.getInstance() : null;
    if(raw && (raw as any).isByteArray) return (raw as any).getBytes().slice();
    return this.latin1(this.strArg(v), truncate);
  }

  private latin1(s: string, truncate: boolean): number[] {
    return Array.from(s).map((c) => {
      let cp = c.codePointAt(0);
      // A character that doesn't fit in a byte becomes '?' (or with %,
      // its low 8 bits).
      if(cp > 255) cp = truncate ? cp & 0xff : 63;
      return cp;
    });
  }

  private packString(item: IItem, out: number[], state: any, v: VmData, ctx: IInherited) {
    let t = item.type;
    let bytes: number[];
    let unit = 1;       // bytes per length unit
    let padByte = (t == 'A' || t == 'U' || t == 'W') ? 32 : 0;
    switch(t) {
      case 'a': case 'A': bytes = this.latin1(this.strArg(v), ctx.truncate); break;
      case 'b': bytes = this.byteArg(v, item, ctx.truncate); break;
      case 'u': case 'U': bytes = utf8(this.strArg(v)); break;
      case 'w': case 'W': {
        unit = item.bang ? 1 : 2;
        bytes = [];
        for(let ch of Array.from(this.strArg(v))) {
          let cp = ch.charCodeAt(0);
          bytes.push(...(ctx.bigEndian ? [cp >> 8, cp & 0xff] : [cp & 0xff, cp >> 8]));
        }
        break;
      }
      case 'h': case 'H': {
        let hex = this.strArg(v);
        let digits = item.star || item.nullTerm ? hex.length : (item.count ?? 1) * (item.bang ? 2 : 1);
        hex = hex.substr(0, digits);
        bytes = [];
        for(let i = 0; i < hex.length; i += 2) {
          let d1 = parseInt(hex[i], 16) || 0;
          let d2 = i + 1 < hex.length ? (parseInt(hex[i + 1], 16) || 0) : 0;
          bytes.push(t == 'H' ? (d1 << 4) | d2 : (d2 << 4) | d1);
        }
        unit = 1;
        let len = item.star || item.nullTerm && item.count === null ? bytes.length : Math.ceil(digits / 2);
        while(bytes.length < len) bytes.push(0);
        this.write(out, state, bytes.slice(0, len));
        if(item.nullTerm) this.write(out, state, [0]);
        return;
      }
    }
    // Length in units: '*' or null termination without a count means the
    // whole string; otherwise the count (default 1), padded or truncated.
    let whole = item.star || (item.nullTerm && item.count === null);
    let len = whole ? bytes.length : (item.count ?? 1) * unit;
    if(!whole) {
      bytes = bytes.slice(0, len);
      while(bytes.length < len) bytes.push(...(unit == 2 ? (ctx.bigEndian ? [0, padByte] : [padByte, 0]) : [padByte]));
    }
    this.write(out, state, bytes);
    if(item.nullTerm) this.write(out, state, (t == 'w' || t == 'W') ? [0, 0] : [0]);
  }

  private packValue(item: IItem, out: number[], state: any, v: VmData, ctx: IInherited) {
    let t = item.type;
    if(t == 'k') {
      let n = this.intArg(v);
      if(n < 0) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
      let digits = [n % 128];
      n = Math.floor(n / 128);
      while(n > 0) { digits.unshift((n % 128) | 0x80); n = Math.floor(n / 128); }
      this.write(out, state, digits);
      return;
    }
    if(t == 'f' || t == 'd') {
      let n = BigNumber.isBigNumber(v) ? BigNumber.of(v).toNumber() : this.intArg(v);
      let buf = new ArrayBuffer(SIZES[t]);
      let view = new DataView(buf);
      if(t == 'f') view.setFloat32(0, n, !ctx.bigEndian);
      else view.setFloat64(0, n, !ctx.bigEndian);
      this.write(out, state, Array.from(new Uint8Array(buf)));
      return;
    }
    if(SIZES[t] === undefined) throw new VmRuntimeError(ERR_SYNTAX);
    if(BigNumber.isBigNumber(v) && SIZES[t] == 8) {
      // 64-bit values from a BigNumber: compute the bytes exactly.
      let d = BigNumber.of(v).value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
      let [lo, hi] = LIMITS[t];
      if((d.lt(lo) || d.gt(hi)) && !ctx.truncate) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
      let two64 = new Decimal(2).pow(64);
      d = d.mod(two64);
      if(d.isNeg()) d = d.plus(two64);
      let bytes: number[] = [];
      for(let i = 0; i < 8; i++) { bytes.push(d.mod(256).toNumber()); d = d.div(256).floor(); }
      this.write(out, state, ctx.bigEndian ? bytes.reverse() : bytes);
      return;
    }
    let n = BigNumber.isBigNumber(v)
      ? BigNumber.of(v).value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber()
      : this.intArg(v);
    let [lo, hi] = LIMITS[t];
    if(n < lo || n > hi) {
      if(!ctx.truncate) throw new VmRuntimeError(VmErr.NUMERIC_OVERFLOW);
    }
    this.write(out, state, intBytes(n, SIZES[t], ctx.bigEndian));
  }

  private intArg(v: VmData): number {
    if(v instanceof VmInt) return v.unpack();
    if(v instanceof VmTrue) return 1;
    if(v instanceof VmNil) return 0;
    let s = v.unpack();
    if(typeof(s) == 'string' && /^\s*[+-]?\d+\s*$/.test(s)) return parseInt(s);
    throw new VmRuntimeError(ERR_TYPE);
  }

  // -------------------------------------------------------------------------
  // Unpacking
  // -------------------------------------------------------------------------

  /**
   * Unpack values from bytes.
   * @param bytes Source bytes
   * @param start 0-based start position
   * @param format Format string
   * @returns Values, and the position after the last byte read
   */
  unpack(bytes: number[], start: number, format: string): { values: VmData[], pos: number } {
    let items = new FormatParser(Array.from(format)).parse();
    let state = { pos: start, start: start };
    let values = this.unpackItems(items, bytes, state, start, { bigEndian: false, tilde: false, truncate: false });
    return { values: values, pos: state.pos };
  }

  private read(bytes: number[], state: { pos: number }, n: number): number[] {
    if(state.pos + n > bytes.length) throw new VmRuntimeError(ERR_READ);
    let out = bytes.slice(state.pos, state.pos + n);
    state.pos += n;
    return out;
  }

  private unpackItems(items: IItem[], bytes: number[], state: any, groupStart: number, ctx: IInherited): VmData[] {
    let values: VmData[] = [];
    for(let item of items) values.push(...this.unpackItem(item, bytes, state, groupStart, inherit(item, ctx)));
    return values;
  }

  private unpackItem(item: IItem, bytes: number[], state: any, groupStart: number, ctx: IInherited): VmData[] {
    if(item.prefix) {
      let countVal = this.unpackItem({ ...item.prefix, count: null, star: false }, bytes, state, groupStart, inherit(item.prefix, ctx));
      let count = countVal[0].unpack();
      return this.unpackItem({ ...item, prefix: undefined, count: count, star: false }, bytes, state, groupStart, ctx);
    }

    switch(item.type) {
      case '"': case '{':
        this.read(bytes, state, item.literal.length);
        return [];
      case 'x':
        if(item.bang) {
          let align = item.count ?? 1;
          while((state.pos - state.start) % align != 0) state.pos++;
        } else {
          state.pos += item.count ?? 1;
        }
        return [];
      case 'X': {
        let n = item.count ?? 1;
        if(item.bang) n = (state.pos - state.start) % n;
        state.pos = Math.max(state.start, state.pos - n);
        return [];
      }
      case '@':
        if(item.query) return [new VmInt(state.pos - (item.bang ? state.start : groupStart))];
        state.pos = (item.bang ? state.start : groupStart) + (item.count ?? 0);
        return [];
      case '(': case '[': {
        let reps = item.star ? Infinity : (item.count ?? 1);
        let all: VmData[] = [];
        let iterations: VmData[] = [];
        for(let r = 0; r < reps; r++) {
          if(reps == Infinity && state.pos >= bytes.length) break;
          let vals = this.unpackItems(item.items, bytes, state, state.pos, ctx);
          if(item.type == '[' && item.bang) iterations.push(new VmList(vals));
          else all.push(...vals);
        }
        if(item.type == '(') return all;
        return item.bang ? iterations : [new VmList(all)];
      }
    }

    if('aAbuUwWhH'.includes(item.type)) return [this.unpackString(item, bytes, state, ctx)];

    // Numeric types
    let reps = item.star ? Infinity : (item.count ?? 1);
    let values: VmData[] = [];
    for(let r = 0; r < reps; r++) {
      if(item.star && state.pos >= bytes.length) break;
      values.push(this.unpackValue(item, bytes, state, ctx));
    }
    return values;
  }

  private unpackValue(item: IItem, bytes: number[], state: any, ctx: IInherited): VmData {
    let t = item.type;
    if(t == 'k') {
      let v = 0;
      while(true) {
        let b = this.read(bytes, state, 1)[0];
        v = v * 128 + (b & 0x7f);
        if(!(b & 0x80)) break;
      }
      return new VmInt(v);
    }
    let size = SIZES[t];
    let raw = this.read(bytes, state, size);
    if(t == 'f' || t == 'd') {
      let view = new DataView(new Uint8Array(raw).buffer);
      let f = t == 'f' ? view.getFloat32(0, !ctx.bigEndian) : view.getFloat64(0, !ctx.bigEndian);
      // Like the reference VM: 8 digits for single, 17 for double precision.
      let prec = t == 'f' ? 8 : 17;
      let d = !isFinite(f) ? new Decimal(f) : new Decimal(f.toPrecision(prec));
      return new VmObject(BigNumber.make(d, prec));
    }
    let signed = t == 'c' || t == 's' || t == 'l' || t == 'q';
    let v = readInt(raw, signed, ctx.bigEndian);
    // L, q and Q unpack as BigNumber, unless ~ is used and the value fits.
    if((t == 'L' || t == 'q' || t == 'Q') && !(ctx.tilde && v >= -2147483648 && v <= 2147483647)) {
      // Compute the value exactly (64-bit values can exceed JS precision).
      let b = ctx.bigEndian ? raw.slice().reverse() : raw;
      let d = new Decimal(0);
      for(let i = b.length - 1; i >= 0; i--) d = d.times(256).plus(b[i]);
      if(signed && b[b.length - 1] >= 0x80) d = d.minus(new Decimal(2).pow(8 * b.length));
      // Precision as in the reference VM: 10 digits for L, 20 for q and Q.
      return new VmObject(BigNumber.make(d, t == 'L' ? 10 : 20));
    }
    return new VmInt(v);
  }

  private unpackString(item: IItem, bytes: number[], state: any, ctx: IInherited): VmData {
    let t = item.type;
    let wide = t == 'w' || t == 'W';
    let hex = t == 'h' || t == 'H';
    let unit = wide && !item.bang ? 2 : 1;
    let raw: number[];

    if(item.nullTerm && item.count === null) {
      // Read up to the terminator, and skip it.
      raw = [];
      let step = wide ? 2 : 1;
      while(true) {
        let ch = this.read(bytes, state, step);
        if(ch.every((b) => b == 0)) break;
        raw.push(...ch);
      }
    } else {
      let len: number;
      if(item.star) len = bytes.length - state.pos;
      else if(hex) len = Math.ceil((item.count ?? 1) / (item.bang ? 1 : 2));
      else len = (item.count ?? 1) * unit;
      raw = this.read(bytes, state, len);
      if(item.nullTerm) this.read(bytes, state, wide ? 2 : 1);
    }

    switch(t) {
      case 'b': return this.byteArrays.make(raw);
      case 'a': return new VmSstring(String.fromCharCode(...raw).replace(/\0+$/, ''));
      case 'A': return new VmSstring(String.fromCharCode(...raw).replace(/ +$/, ''));
      case 'u': return new VmSstring(fromUtf8(raw).replace(/\0+$/, ''));
      case 'U': return new VmSstring(fromUtf8(raw).replace(/ +$/, ''));
      case 'w': case 'W': {
        let s = '';
        for(let i = 0; i + 1 < raw.length; i += 2) {
          s += String.fromCharCode(ctx.bigEndian ? (raw[i] << 8) | raw[i + 1] : raw[i] | (raw[i + 1] << 8));
        }
        return new VmSstring(t == 'w' ? s.replace(/\0+$/, '') : s.replace(/ +$/, ''));
      }
      case 'h': case 'H': {
        let s = '';
        for(let b of raw) {
          let hi = (b >> 4).toString(16), lo = (b & 0xf).toString(16);
          s += t == 'H' ? hi + lo : lo + hi;
        }
        let digits = item.star || (item.nullTerm && item.count === null) ? s.length : (item.count ?? 1) * (item.bang ? 2 : 1);
        return new VmSstring(s.substr(0, digits));
      }
    }
  }
}
