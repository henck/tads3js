import { Platform } from '../Platform';

/**
 * Random number generators for rand() and randomize(): ISAAC (the
 * default), a linear congruential generator, and the Mersenne Twister
 * MT19937, plus the random string template language of rand('...').
 *
 * Each generator's state can be saved and restored (randomize(nil) and
 * randomize([id, state])). Seeding a generator with the same value always
 * gives the same sequence. Like the reference VM, a program starts with
 * ISAAC in its unseeded initial state, which (unless that's turned off, as
 * with t3run -norand) is then seeded randomly; with the same unseeded
 * start, rand(n) gives the same numbers as the reference VM. (Sequences
 * from explicit seeds don't match the reference VM's, whose procedure for
 * turning seed values into seed words isn't documented.)
 */

export const RNG_ISAAC = 1;
export const RNG_LCG = 2;
export const RNG_MT19937 = 3;

interface IGenerator {
  next(): number;                 // next 32-bit unsigned value
  seed(words: number[]): void;
  getState(): string;
  setState(state: string): void;
}

/** Linear congruential generator (Knuth, The Art of Computer Programming vol 2). */
class Lcg implements IGenerator {
  private x = 0;
  next(): number {
    this.x = (Math.imul(this.x, 1664525) + 1013904223) >>> 0;
    return this.x;
  }
  seed(words: number[]) {
    this.x = words.reduce((a, w) => (Math.imul(a, 31) + w) >>> 0, 0);
  }
  getState() { return String(this.x); }
  setState(s: string) { this.x = parseInt(s) >>> 0; }
}

/** Mersenne Twister MT19937. */
class Mt19937 implements IGenerator {
  private mt = new Array<number>(624);
  private idx = 625;

  private init(s: number) {
    this.mt[0] = s >>> 0;
    for(let i = 1; i < 624; i++) {
      let p = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (Math.imul(1812433253, p) + i) >>> 0;
    }
    this.idx = 624;
  }

  seed(words: number[]) {
    // init_by_array
    this.init(19650218);
    let key = words.length ? words : [0];
    let i = 1, j = 0;
    for(let k = Math.max(624, key.length); k > 0; k--) {
      let p = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = ((this.mt[i] ^ Math.imul(p, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if(i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
      if(j >= key.length) j = 0;
    }
    for(let k = 623; k > 0; k--) {
      let p = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = ((this.mt[i] ^ Math.imul(p, 1566083941)) - i) >>> 0;
      i++;
      if(i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
    }
    this.mt[0] = 0x80000000;
  }

  next(): number {
    if(this.idx >= 624) {
      if(this.idx == 625) this.init(5489);
      for(let k = 0; k < 624; k++) {
        let y = (this.mt[k] & 0x80000000) | (this.mt[(k + 1) % 624] & 0x7fffffff);
        this.mt[k] = (this.mt[(k + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)) >>> 0;
      }
      this.idx = 0;
    }
    let y = this.mt[this.idx++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  getState() { return JSON.stringify([this.mt, this.idx]); }
  setState(s: string) { [this.mt, this.idx] = JSON.parse(s); }
}

/** ISAAC (Bob Jenkins). */
class Isaac implements IGenerator {
  private m = new Array<number>(256).fill(0);
  private r = new Array<number>(256).fill(0);
  private a = 0; private b = 0; private c = 0;
  private count = 0;

  constructor() { this.seed([], false); }

  /**
   * Initialize: with the seed words, or (if useSeed is false) without them,
   * as ISAAC's randinit(FALSE) does.
   */
  seed(words: number[], useSeed = true) {
    for(let i = 0; i < 256; i++) this.r[i] = (words[i] ?? 0) >>> 0;
    this.a = this.b = this.c = 0;
    let s = new Array<number>(8).fill(0x9e3779b9);
    let mix = () => {
      s[0] ^= s[1] << 11;  s[3] = (s[3] + s[0]) >>> 0; s[1] = (s[1] + s[2]) >>> 0;
      s[1] ^= s[2] >>> 2;  s[4] = (s[4] + s[1]) >>> 0; s[2] = (s[2] + s[3]) >>> 0;
      s[2] ^= s[3] << 8;   s[5] = (s[5] + s[2]) >>> 0; s[3] = (s[3] + s[4]) >>> 0;
      s[3] ^= s[4] >>> 16; s[6] = (s[6] + s[3]) >>> 0; s[4] = (s[4] + s[5]) >>> 0;
      s[4] ^= s[5] << 10;  s[7] = (s[7] + s[4]) >>> 0; s[5] = (s[5] + s[6]) >>> 0;
      s[5] ^= s[6] >>> 4;  s[0] = (s[0] + s[5]) >>> 0; s[6] = (s[6] + s[7]) >>> 0;
      s[6] ^= s[7] << 8;   s[1] = (s[1] + s[6]) >>> 0; s[7] = (s[7] + s[0]) >>> 0;
      s[7] ^= s[0] >>> 9;  s[2] = (s[2] + s[7]) >>> 0; s[0] = (s[0] + s[1]) >>> 0;
      for(let k = 0; k < 8; k++) s[k] >>>= 0;
    };
    for(let i = 0; i < 4; i++) mix();
    if(!useSeed) {
      for(let i = 0; i < 256; i += 8) {
        mix();
        for(let k = 0; k < 8; k++) this.m[i + k] = s[k];
      }
      this.generate();
      return;
    }
    for(let pass = 0; pass < 2; pass++) {
      let src = pass == 0 ? this.r : this.m;
      for(let i = 0; i < 256; i += 8) {
        for(let k = 0; k < 8; k++) s[k] = (s[k] + src[i + k]) >>> 0;
        mix();
        for(let k = 0; k < 8; k++) this.m[i + k] = s[k];
      }
    }
    this.generate();
  }

  private generate() {
    this.c = (this.c + 1) >>> 0;
    this.b = (this.b + this.c) >>> 0;
    for(let i = 0; i < 256; i++) {
      let x = this.m[i];
      switch(i & 3) {
        case 0: this.a ^= this.a << 13; break;
        case 1: this.a ^= this.a >>> 6; break;
        case 2: this.a ^= this.a << 2; break;
        case 3: this.a ^= this.a >>> 16; break;
      }
      this.a = (this.a + this.m[(i + 128) & 255]) >>> 0;
      let y = (this.m[(x >>> 2) & 255] + this.a + this.b) >>> 0;
      this.m[i] = y;
      this.b = (this.m[(y >>> 10) & 255] + x) >>> 0;
      this.r[i] = this.b;
    }
    this.count = 256;
  }

  next(): number {
    if(this.count == 0) this.generate();
    return this.r[--this.count];
  }

  getState() { return JSON.stringify([this.m, this.r, this.a, this.b, this.c, this.count]); }
  setState(s: string) { [this.m, this.r, this.a, this.b, this.c, this.count] = JSON.parse(s); }
}

/** Seed words from an integer or a string (its UTF-16 code units). */
function seedWords(val: number | string): number[] {
  if(typeof(val) == 'number') return [val >>> 0];
  let words: number[] = [];
  for(let i = 0; i < val.length; i += 2) {
    words.push(((val.charCodeAt(i) << 16) | (i + 1 < val.length ? val.charCodeAt(i + 1) : 0)) >>> 0);
  }
  return words;
}

/** Truly random seed words from the operating system. */
function osSeed(): number[] {
  let bytes = Platform.get().randomBytes(64);
  let words: number[] = [];
  for(let i = 0; i < 64; i += 4) words.push(((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0);
  return words;
}

class RandomState {
  private gens: { [id: number]: IGenerator } = {
    [RNG_ISAAC]: new Isaac(), [RNG_LCG]: new Lcg(), [RNG_MT19937]: new Mt19937()
  };
  public id = RNG_ISAAC;

  constructor() { this.reset(true); }

  /**
   * Start a program: ISAAC in its unseeded initial state, then seeded with
   * random data unless randomSeed is false.
   */
  reset(randomSeed: boolean) {
    this.gens[RNG_ISAAC] = new Isaac();
    this.gens[RNG_LCG] = new Lcg();
    this.gens[RNG_MT19937] = new Mt19937();
    this.id = RNG_ISAAC;
    if(randomSeed) this.gens[RNG_ISAAC].seed(osSeed());
  }

  private get gen() { return this.gens[this.id]; }

  /** Select an algorithm (and optionally seed it: null for OS seed data). */
  select(id: number, seed?: number | string | null) {
    if(!this.gens[id]) throw new Error('unknown RNG');
    this.id = id;
    if(seed === null) this.gen.seed(osSeed());
    else if(seed !== undefined) this.gen.seed(seedWords(seed));
  }

  getState(): [number, string] { return [this.id, this.gen.getState()]; }

  setState(id: number, state: string) {
    this.id = id;
    this.gen.setState(state);
  }

  /**
   * Random integer from 0 to n-1 (n up to 2^32): like the reference VM,
   * floor(x * n / 2^32) for the next 32-bit value x (computed exactly, in
   * 16-bit pieces).
   */
  int(n: number): number {
    let x = this.gen.next() >>> 0;
    if(n <= 1) return 0;
    let xh = x >>> 16, xl = x & 0xffff, nh = Math.floor(n / 65536), nl = n % 65536;
    let mid1 = xh * nl, mid2 = xl * nh;
    let carry = Math.floor((Math.floor(xl * nl / 65536) + (mid1 % 65536) + (mid2 % 65536)) / 65536);
    return xh * nh + Math.floor(mid1 / 65536) + Math.floor(mid2 / 65536) + carry;
  }
}

export const random = new RandomState();

// ---------------------------------------------------------------------------
// Random string templates
// ---------------------------------------------------------------------------

type TNode =
  | { kind: 'chars', pick: () => string }
  | { kind: 'seq', items: TNode[] }
  | { kind: 'alt', options: TNode[] }
  | { kind: 'rep', body: TNode, min: number, max: number };   // max -1: open-ended

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i));
const LOWER = range(97, 122), UPPER = range(65, 90), DIGITS = range(48, 57);
const CODES: { [c: string]: string[] } = {
  a: LOWER, A: UPPER, c: LOWER.concat(UPPER), z: DIGITS.concat(LOWER, UPPER), d: DIGITS,
  x: DIGITS.concat(range(97, 102)), X: DIGITS.concat(range(65, 70)),
  i: range(0x20, 0x7e), l: range(0x20, 0x7e).concat(range(0xa0, 0xff)), b: range(0, 0xff),
};
const printable = new RegExp('^[\\p{L}\\p{M}\\p{N}\\p{P}\\p{S}\\p{Zs}]$', 'u');

function pickFrom(set: string[]): () => string {
  return () => set[random.int(set.length)];
}

function pickUnicode(): string {
  while(true) {
    let c = String.fromCharCode(random.int(0x10000));
    if(printable.test(c)) return c;
  }
}

class TemplateParser {
  private pos = 0;
  constructor(private s: string[]) {}

  parse(): TNode { return this.alt(); }

  private alt(): TNode {
    let options = [this.seq()];
    while(this.s[this.pos] == '|') { this.pos++; options.push(this.seq()); }
    return options.length == 1 ? options[0] : { kind: 'alt', options: options };
  }

  private seq(): TNode {
    let items: TNode[] = [];
    while(this.pos < this.s.length && this.s[this.pos] != '|' && this.s[this.pos] != ')') {
      let atom = this.atom();
      if(atom) items.push(this.postfix(atom));
    }
    return { kind: 'seq', items: items };
  }

  private postfix(atom: TNode): TNode {
    while(true) {
      let c = this.s[this.pos];
      if(c == '?') { this.pos++; atom = { kind: 'rep', body: atom, min: 0, max: 1 }; }
      else if(c == '*') { this.pos++; atom = { kind: 'rep', body: atom, min: 0, max: -1 }; }
      else if(c == '+') { this.pos++; atom = { kind: 'rep', body: atom, min: 1, max: -1 }; }
      else if(c == '{') {
        let m = /^\{(\d+)(,?)(\d*)\}/.exec(this.s.slice(this.pos).join(''));
        if(!m) return atom;
        this.pos += m[0].length;
        let min = parseInt(m[1]);
        let max = m[2] == '' ? min : (m[3] == '' ? -1 : parseInt(m[3]));
        atom = { kind: 'rep', body: atom, min: min, max: max };
      }
      else return atom;
    }
  }

  private atom(): TNode {
    let c = this.s[this.pos++];
    if(CODES[c]) return { kind: 'chars', pick: pickFrom(CODES[c]) };
    if(c == 'u') return { kind: 'chars', pick: pickUnicode };
    if(c == '%') {
      let lit = this.s[this.pos++] ?? '';
      return { kind: 'chars', pick: () => lit };
    }
    if(c == '"') {
      // Literal text; "" is a quote.
      let text = '';
      while(this.pos < this.s.length) {
        let ch = this.s[this.pos++];
        if(ch == '"') {
          if(this.s[this.pos] == '"') { text += '"'; this.pos++; }
          else break;
        } else {
          text += ch;
        }
      }
      return { kind: 'chars', pick: () => text };
    }
    if(c == '[') {
      let set: string[] = [];
      while(this.pos < this.s.length && this.s[this.pos] != ']') {
        let ch = this.s[this.pos++];
        if(ch == '%') ch = this.s[this.pos++] ?? '';
        if(this.s[this.pos] == '-' && this.s[this.pos + 1] !== undefined && this.s[this.pos + 1] != ']') {
          let hi = this.s[this.pos + 1] == '%' ? this.s[this.pos + 2] : this.s[this.pos + 1];
          this.pos += this.s[this.pos + 1] == '%' ? 3 : 2;
          set.push(...range(ch.charCodeAt(0), hi.charCodeAt(0)));
        } else {
          set.push(ch);
        }
      }
      this.pos++;
      return { kind: 'chars', pick: set.length ? pickFrom(set) : () => '' };
    }
    if(c == '(') {
      let node = this.alt();
      if(this.s[this.pos] == ')') this.pos++;
      return node;
    }
    // Anything else is ignored.
    return null;
  }
}

function generate(node: TNode): string {
  switch(node.kind) {
    case 'chars': return node.pick();
    case 'seq': return node.items.map(generate).join('');
    case 'alt': return generate(node.options[random.int(node.options.length)]);
    case 'rep': {
      let n = node.max >= 0 ? node.min + random.int(node.max - node.min + 1) : node.min;
      // Open-ended: each extra item is added with probability 2/3.
      if(node.max < 0) while(random.int(3) < 2) n++;
      let out = '';
      for(let i = 0; i < n; i++) out += generate(node.body);
      return out;
    }
  }
}

/** Build a random string from a rand() template. */
export function randomString(template: string): string {
  return generate(new TemplateParser(Array.from(template)).parse());
}
