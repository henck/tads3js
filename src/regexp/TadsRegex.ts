/**
 * A regular expression engine implementing TADS 3 pattern syntax and
 * matching rules (see "Regular Expressions" in the System Manual).
 *
 * TADS semantics differ from JavaScript's, so patterns can't simply be
 * translated to RegExp:
 *
 * - At every choice point (an alternation, or whether a closure repeats
 *   once more), the matcher evaluates each option through to the end of
 *   the pattern and keeps the one giving the longest overall match. With
 *   the <Min> flag, or for a shortest-match closure (*?, +?, ??, {}?), it
 *   keeps the shortest. Ties go to the preferred option, which gives the
 *   earliest groups the longest text. So 'a|ab' matches all of 'ab'.
 * - <FirstEnd> picks the match that ends earliest, rather than the one
 *   that begins earliest (<FirstBegin>, the default).
 * - Word characters (%w, %<, %>, %b) are alphanumeric, without '_'.
 * - <NoCase> uses case folding; contiguous literal text is matched as a
 *   unit, so a 'ß' can match 'ss' and vice versa.
 * - Look-behind assertions may have any length.
 */

// ---------------------------------------------------------------------------
// Match results
// ---------------------------------------------------------------------------

export interface IMatchGroup {
  value: string;
  index: number;    // 0-based
  length: number;
}

/**
 * A successful match: the matched text and its position, plus groups
 * (groups[0] is the whole match; a group that didn't take part in the
 * match is undefined).
 */
export class Match {
  public value: string = '';
  public index: number = 0;
  public length: number = 0;
  public groups: IMatchGroup[] = [];
}

// ---------------------------------------------------------------------------
// Character classification
// ---------------------------------------------------------------------------

type CharTest = (c: string) => boolean;

const re = (src: string) => { let r = new RegExp(src, 'u'); return (c: string) => r.test(c); };

const isAlpha = re('^\\p{L}$');
const isUpper = re('^\\p{Lu}$');
const isLower = re('^\\p{Ll}$');
const isDigit = re('^\\p{Nd}$');
const isPunct = re('^\\p{P}$');
const isAlphaNum: CharTest = (c) => isAlpha(c) || isDigit(c);
const isSpace = re('^[ \\t\\f\\u001F\\u00A0\\u2000-\\u200B\\u0085\\u1680\\u202F\\u205F\\u3000]$');
const isVSpace = re('^[\\r\\n\\u000B\\u001C-\\u001E\\u2028\\u2029]$');
const isNewline = re('^[\\r\\n\\u000B\\u2028\\u2029]$');

const CLASSES: { [name: string]: CharTest } = {
  alpha: isAlpha, upper: isUpper, lower: isLower, digit: isDigit,
  alphanum: isAlphaNum, space: isSpace, vspace: isVSpace, punct: isPunct,
  newline: isNewline,
};

const NAMED_CHARS: { [name: string]: string } = {
  lparen: '(', rparen: ')', lsquare: '[', rsquare: ']', lbrace: '{', rbrace: '}',
  langle: '<', rangle: '>', vbar: '|', caret: '^', period: '.', dot: '.',
  squote: '\'', dquote: '"', star: '*', plus: '+', percent: '%', question: '?',
  dollar: '$', backslash: '\\', return: '\r', linefeed: '\n', tab: '\t',
  nul: '\u0000', null: '\u0000',
};

const isWordChar = isAlphaNum;

/** Case-fold a character (may expand, e.g. 'ß' -> 'ss'). */
function fold(c: string): string {
  return c.toUpperCase().toLowerCase();
}

// ---------------------------------------------------------------------------
// Syntax tree
// ---------------------------------------------------------------------------

interface IRepeat { type: 'repeat', body: Node, min: number, max: number, lazy: boolean }

type Node =
  | { type: 'lit', text: string }
  | { type: 'set', test: CharTest }
  | { type: 'any' }
  | { type: 'bol' } | { type: 'eol' }
  | { type: 'wordStart' } | { type: 'wordEnd' } | { type: 'wordBound' } | { type: 'nonWordBound' }
  | { type: 'group', index: number, body: Node }        // index 0: non-capturing
  | { type: 'alt', options: Node[] }
  | { type: 'seq', items: Node[] }
  | IRepeat
  | { type: 'backref', n: number }
  | { type: 'assert', behind: boolean, negate: boolean, body: Node };

interface IFlags {
  noCase: boolean;
  firstEnd: boolean;
  min: boolean;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
  private pos = 0;
  public groupCount = 0;
  public hasBackref = false;
  public flags: IFlags = { noCase: false, firstEnd: false, min: false };

  constructor(private src: string[]) {}

  parse(): Node {
    let node = this.parseAlt();
    // A stray ')' is taken literally.
    while(this.pos < this.src.length) {
      this.pos++;
      node = { type: 'seq', items: [node, { type: 'lit', text: ')' }, this.parseAlt()] };
    }
    return node;
  }

  private peek(offset = 0): string { return this.src[this.pos + offset]; }

  private parseAlt(): Node {
    let options: Node[] = [this.parseSeq()];
    while(this.peek() == '|') {
      this.pos++;
      options.push(this.parseSeq());
    }
    return options.length == 1 ? options[0] : { type: 'alt', options: options };
  }

  private parseSeq(): Node {
    let items: Node[] = [];
    while(this.pos < this.src.length && this.peek() != '|' && this.peek() != ')') {
      let atom = this.parseAtom();
      if(atom === null) continue;              // a flag, which matches nothing
      items.push(this.parseQuantifiers(atom));
    }
    // Merge adjacent literals, so case folding can work on whole runs.
    let merged: Node[] = [];
    for(let item of items) {
      let last = merged[merged.length - 1];
      if(item.type == 'lit' && last && last.type == 'lit') {
        merged[merged.length - 1] = { type: 'lit', text: last.text + item.text };
      } else {
        merged.push(item);
      }
    }
    return merged.length == 1 ? merged[0] : { type: 'seq', items: merged };
  }

  private parseQuantifiers(atom: Node): Node {
    while(true) {
      let c = this.peek();
      let min: number, max: number;
      if(c == '*') { min = 0; max = Infinity; this.pos++; }
      else if(c == '+') { min = 1; max = Infinity; this.pos++; }
      else if(c == '?') { min = 0; max = 1; this.pos++; }
      else if(c == '{') {
        let m = /^\{(\d*)(,?)(\d*)\}/.exec(this.src.slice(this.pos).join(''));
        if(!m || (m[1] == '' && m[3] == '')) return atom;   // not an interval
        min = m[1] == '' ? 0 : parseInt(m[1]);
        max = m[2] == '' ? min : (m[3] == '' ? Infinity : parseInt(m[3]));
        this.pos += m[0].length;
      }
      else return atom;
      let lazy = false;
      if(this.peek() == '?') { lazy = true; this.pos++; }
      atom = { type: 'repeat', body: atom, min: min, max: max, lazy: lazy };
    }
  }

  /** Parse one atom; returns null for a global flag. */
  private parseAtom(): Node {
    let c = this.src[this.pos++];
    switch(c) {
      case '.': return { type: 'any' };
      case '^': return { type: 'bol' };
      case '$': return { type: 'eol' };
      case '(': return this.parseGroup();
      case '[': return this.parseRange();
      case '<': return this.parseAngle();
      case '%': return this.parseEscape();
      case '*': case '+': case '?':
        // A closure with nothing to apply to is taken literally.
        return { type: 'lit', text: c };
      default: return { type: 'lit', text: c };
    }
  }

  private parseGroup(): Node {
    let node: Node;
    if(this.peek() == '?') {
      let kind = this.peek(1);
      if(kind == ':') { this.pos += 2; node = { type: 'group', index: 0, body: this.parseAlt() }; }
      else if(kind == '=' || kind == '!') {
        this.pos += 2;
        node = { type: 'assert', behind: false, negate: kind == '!', body: this.parseAlt() };
      }
      else if(kind == '<' && (this.peek(2) == '=' || this.peek(2) == '!')) {
        let negate = this.peek(2) == '!';
        this.pos += 3;
        node = { type: 'assert', behind: true, negate: negate, body: this.parseAlt() };
      }
    }
    if(!node) {
      let index = ++this.groupCount;
      node = { type: 'group', index: index, body: this.parseAlt() };
    }
    if(this.peek() == ')') this.pos++;
    return node;
  }

  private parseRange(): Node {
    let negate = false;
    if(this.peek() == '^') { negate = true; this.pos++; }
    let tests: CharTest[] = [];
    let first = true;
    while(this.pos < this.src.length && (this.peek() != ']' || first)) {
      let c = this.src[this.pos++];
      // A leading ']' is literal, and doesn't start a range: '[]-^]'
      // matches ']', '-' or '^'.
      let leadingBracket = first && c == ']';
      first = false;
      if(!leadingBracket && this.peek() == '-' && this.peek(1) !== undefined && this.peek(1) != ']') {
        let hi = this.src[this.pos + 1];
        this.pos += 2;
        let lo = c;
        tests.push((x) => x >= lo && x <= hi);
      } else {
        tests.push((x) => x == c);
      }
    }
    if(this.peek() == ']') this.pos++;
    let test: CharTest = (x) => tests.some((t) => t(x));
    return { type: 'set', test: negate ? (x) => !test(x) : test };
  }

  /** <...>: a character class expression, or a global flag. */
  private parseAngle(): Node {
    let end = this.src.indexOf('>', this.pos);
    if(end < 0) return { type: 'lit', text: '<' };
    let content = this.src.slice(this.pos, end).join('');
    this.pos = end + 1;

    switch(content.toLowerCase()) {
      case 'case': this.flags.noCase = false; return null;
      case 'nocase': this.flags.noCase = true; return null;
      case 'firstbegin': case 'fb': this.flags.firstEnd = false; return null;
      case 'firstend': case 'fe': this.flags.firstEnd = true; return null;
      case 'max': this.flags.min = false; return null;
      case 'min': this.flags.min = true; return null;
    }

    let negate = false;
    if(content.startsWith('^')) { negate = true; content = content.substr(1); }
    let tests = content.split('|').map((part): CharTest => {
      let lower = part.toLowerCase();
      if(CLASSES[lower]) return CLASSES[lower];
      if(NAMED_CHARS[lower] !== undefined) { let ch = NAMED_CHARS[lower]; return (x) => x == ch; }
      let chars = Array.from(part);
      if(chars.length == 3 && chars[1] == '-') return (x) => x >= chars[0] && x <= chars[2];
      return (x) => chars.includes(x);
    });
    let test: CharTest = (x) => tests.some((t) => t(x));
    return { type: 'set', test: negate ? (x) => !test(x) : test };
  }

  private parseEscape(): Node {
    let c = this.src[this.pos++];
    if(c === undefined) return { type: 'lit', text: '%' };
    if(c >= '1' && c <= '9') { this.hasBackref = true; return { type: 'backref', n: parseInt(c) }; }
    switch(c) {
      case '<': return { type: 'wordStart' };
      case '>': return { type: 'wordEnd' };
      case 'b': return { type: 'wordBound' };
      case 'B': return { type: 'nonWordBound' };
      case 'd': return { type: 'set', test: isDigit };
      case 'D': return { type: 'set', test: (x) => !isDigit(x) };
      case 's': return { type: 'set', test: isSpace };
      case 'S': return { type: 'set', test: (x) => !isSpace(x) };
      case 'v': return { type: 'set', test: isVSpace };
      case 'V': return { type: 'set', test: (x) => !isVSpace(x) };
      case 'w': return { type: 'set', test: isWordChar };
      case 'W': return { type: 'set', test: (x) => !isWordChar(x) };
      default: return { type: 'lit', text: c };   // quoted character
    }
  }
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

// Group positions: [start, end] per group number, or undefined.
type Groups = ([number, number] | undefined)[];

interface IResult {
  end: number;
  groups: Groups;
}

type Cont = (pos: number, groups: Groups) => IResult;

// A state of the compiled pattern graph.
interface NState {
  id: number;
  kind: 'char' | 'lit' | 'split' | 'eps' | 'assert' | 'gstart' | 'gend' | 'match';
  next?: NState;
  alt?: NState;                       // split: the other option
  shortest?: boolean;                 // split: prefer the shorter result
  test?: CharTest;                    // char
  text?: string;                      // lit
  check?: (pos: number) => boolean;   // assert
  idx?: number;                       // gstart/gend: group number
}

// Marks a table entry being computed (to detect cycles).
const IN_PROGRESS: IResult = { end: -1, groups: [] };

export class TadsRegex {
  private root: Node;
  private groupCount: number;
  private flags: IFlags;

  // Subject string (as an array of characters) during a match.
  private s: string[];

  /**
   * @param pattern Pattern in TADS syntax
   * @param noCase Force case-insensitive matching
   */
  constructor(public readonly pattern: string, noCase?: boolean) {
    let parser = new Parser(Array.from(pattern));
    this.root = parser.parse();
    this.groupCount = parser.groupCount;
    this.flags = parser.flags;
    if(noCase) this.flags.noCase = true;
    // Patterns with back-references depend on earlier captures, which the
    // table-driven matcher can't express; they use the recursive matcher.
    if(!parser.hasBackref) {
      this.states = [];
      this.start = this.compile(this.root, this.newState({ kind: 'match' }));
    }
    let f = this.first(this.root);
    this.firstTest = f.nullable || f.test === 'any' ? null : f.test;
    let prefix = Array.from(this.prefixOf(this.root));
    // (With case folding, only a prefix of characters without case.)
    if(this.flags.noCase && prefix.some((c) => fold(c) !== c || c.toUpperCase() !== c)) prefix = [];
    this.prefix = prefix.length > 1 ? prefix : null;
  }

  // Characters every match starts with (if more than one is known), or null.
  private prefix: string[] = null;

  /** The literal text a match of a node must start with ('' if none). */
  private prefixOf(node: Node): string {
    switch(node.type) {
      case 'lit': return node.text;
      case 'group': return this.prefixOf(node.body);
      case 'seq': {
        let out = '';
        for(let item of node.items) {
          if(item.type == 'lit') { out += item.text; continue; }
          out += this.prefixOf(item);
          break;
        }
        return out;
      }
      default: return '';
    }
  }

  /** The next position at or after 'from' where a match could start, or -1. */
  private nextCandidate(chars: string[], from: number): number {
    let t = this.firstTest;
    if(!t) return from <= chars.length ? from : -1;
    let pre = this.prefix;
    outer:
    for(let i = from; i < chars.length; i++) {
      if(!t(chars[i])) continue;
      if(pre) {
        if(i + pre.length > chars.length) return -1;
        for(let k = 1; k < pre.length; k++) if(chars[i + k] !== pre[k]) continue outer;
      }
      return i;
    }
    return -1;
  }

  // The subject string most recently split into characters.
  private lastStr: string = null;
  private lastChars: string[] = null;

  private charsOf(str: string): string[] {
    if(str !== this.lastStr) {
      this.lastStr = str;
      this.lastChars = Array.from(str);
    }
    return this.lastChars;
  }

  // A test that the first character of any match passes (conservatively),
  // or null if a match can be empty or start with anything. Searching a
  // string with no such character can stop at once.
  private firstTest: CharTest = null;

  /** First-character analysis of a node. */
  private first(node: Node): { test: CharTest | 'any', nullable: boolean } {
    const none = { test: null as CharTest, nullable: true };
    const union = (a: CharTest | 'any', b: CharTest | 'any'): CharTest | 'any' =>
      a === 'any' || b === 'any' ? 'any' : !a ? b : !b ? a : (c) => a(c) || b(c);
    const noCase = this.flags.noCase;
    switch(node.type) {
      case 'lit': {
        let ch = Array.from(node.text)[0];
        if(ch === undefined) return none;
        if(!noCase) return { test: (c) => c === ch, nullable: false };
        let f = fold(ch)[0];
        return { test: (c) => fold(c)[0] === f, nullable: false };
      }
      case 'set': {
        let t = node.test;
        return { test: noCase ? (c) => t(c) || t(c.toLowerCase()) || t(c.toUpperCase()) : t, nullable: false };
      }
      case 'any': case 'backref': return { test: 'any', nullable: true };
      case 'group': return this.first(node.body);
      case 'alt': {
        let test: CharTest | 'any' = null, nullable = false;
        for(let o of node.options) { let f = this.first(o); test = union(test, f.test); nullable = nullable || f.nullable; }
        return { test: test, nullable: nullable };
      }
      case 'seq': {
        let test: CharTest | 'any' = null;
        for(let item of node.items) {
          let f = this.first(item);
          test = union(test, f.test);
          if(!f.nullable) return { test: test, nullable: false };
        }
        return { test: test, nullable: true };
      }
      case 'repeat': {
        let f = this.first(node.body);
        return { test: f.test, nullable: f.nullable || node.min == 0 };
      }
      default:
        // Zero-width: anchors, word boundaries, assertions.
        return none;
    }
  }



  /**
   * Search for the first match at or after a position.
   * @param str Subject string
   * @param start 0-based start position
   * @returns Match, or null
   */
  exec(str: string, start: number = 0): Match {
    let chars = this.charsOf(str);
    start = Math.max(0, Math.min(start, chars.length));
    let best: IResult = null;
    let bestStart = -1;
    for(let p = this.nextCandidate(chars, start); p >= 0; p = this.nextCandidate(chars, p + 1)) {
      // With <FirstEnd>, a match starting after the best end can't end earlier.
      if(best && p > best.end) break;
      let r = this.run(chars, p);
      if(!r) continue;
      if(!this.flags.firstEnd) return this.toMatch(chars, p, r);
      if(!best || r.end < best.end) { best = r; bestStart = p; }
    }
    return best ? this.toMatch(chars, bestStart, best) : null;
  }

  /**
   * Match exactly at a position.
   * @param str Subject string
   * @param pos 0-based position
   * @returns Match, or null
   */
  matchAt(str: string, pos: number): Match {
    let chars = this.charsOf(str);
    if(this.firstTest && this.nextCandidate(chars, pos) != pos) return null;
    let r = this.run(chars, pos);
    return r ? this.toMatch(chars, pos, r) : null;
  }

  /**
   * Search backwards for the match that ends furthest right, no later
   * than 'end'; among matches with that end, the one starting earliest.
   * @param str Subject string
   * @param end 0-based exclusive end position
   * @returns Match, or null
   */
  execLast(str: string, end: number): Match {
    let chars = Array.from(str);
    end = Math.max(0, Math.min(end, chars.length));
    for(let e = end; e >= 0; e--) {
      for(let p = 0; p <= e; p++) {
        this.s = chars;
        let r = this.m(this.root, p, [], (pos, g) => pos == e ? { end: pos, groups: g } : null);
        if(r) return this.toMatch(chars, p, r);
      }
    }
    return null;
  }

  private run(chars: string[], pos: number): IResult {
    this.s = chars;
    if(this.start) return this.table(chars, pos)[this.start.id][pos];
    return this.m(this.root, pos, [], (p, g) => ({ end: p, groups: g }));
  }

  // -------------------------------------------------------------------------
  // Table-driven matcher
  //
  // The pattern is compiled to a graph of states (Thompson construction).
  // For a subject string, we compute the best match result from every state
  // at every position, working backwards from the end of the string: a
  // state that consumes characters looks up its successor's result further
  // along, and at a split (a choice point) we apply the same selection rules
  // as the recursive matcher. Within one position, states are evaluated
  // recursively, but only through zero-width transitions, so the depth is
  // bounded by the pattern size rather than the string length. A cycle at
  // one position (a loop iteration that matched nothing) fails.
  // -------------------------------------------------------------------------

  private states: NState[] = null;
  private start: NState = null;
  private cache: { chars: string[], results: IResult[][], from: number } = null;

  private newState(props: Partial<NState>): NState {
    let st = { id: this.states.length, ...props } as NState;
    this.states.push(st);
    return st;
  }

  /** Compile a node into states leading to 'next'; returns the entry state. */
  private compile(node: Node, next: NState): NState {
    switch(node.type) {
      case 'lit': return this.newState({ kind: 'lit', text: node.text, next: next });
      case 'set': {
        let t = node.test;
        let test: CharTest = this.flags.noCase ? (c) => t(c) || t(c.toLowerCase()) || t(c.toUpperCase()) : t;
        return this.newState({ kind: 'char', test: test, next: next });
      }
      case 'any': return this.newState({ kind: 'char', test: () => true, next: next });
      case 'bol': case 'eol': case 'wordStart': case 'wordEnd': case 'wordBound': case 'nonWordBound': case 'assert': {
        let n = node;
        return this.newState({ kind: 'assert', check: (pos) => this.zeroWidth(n, pos), next: next });
      }
      case 'seq': {
        let st = next;
        for(let i = node.items.length - 1; i >= 0; i--) st = this.compile(node.items[i], st);
        return st;
      }
      case 'alt': {
        // A chain of splits; choosing pairwise gives the best option, with
        // ties going to the earliest.
        let st = this.compile(node.options[node.options.length - 1], next);
        for(let i = node.options.length - 2; i >= 0; i--) {
          st = this.newState({ kind: 'split', next: this.compile(node.options[i], next), alt: st, shortest: this.flags.min });
        }
        return st;
      }
      case 'group': {
        if(node.index == 0) return this.compile(node.body, next);
        let end = this.newState({ kind: 'gend', idx: node.index, next: next });
        return this.newState({ kind: 'gstart', idx: node.index, next: this.compile(node.body, end) });
      }
      case 'repeat': {
        let rep = node;
        let shortest = rep.lazy ? true : this.flags.min;
        // A split whose preferred option is another iteration (greedy) or
        // leaving the loop (lazy).
        let split = (iterate: NState, leave: NState) => rep.lazy
          ? this.newState({ kind: 'split', next: leave, alt: iterate, shortest: shortest })
          : this.newState({ kind: 'split', next: iterate, alt: leave, shortest: shortest });
        let tail: NState;
        if(rep.max == Infinity) {
          // Loop: L = split(body -> L, next)
          let loop = this.newState({ kind: 'eps' });
          let sp = split(this.compile(rep.body, loop), next);
          loop.next = sp;
          tail = sp;
        } else {
          // Optional copies: split(body -> split(body -> ... next), next)
          tail = next;
          for(let i = rep.min; i < rep.max; i++) tail = split(this.compile(rep.body, tail), next);
        }
        // Required copies.
        for(let i = 0; i < rep.min; i++) tail = this.compile(rep.body, tail);
        return tail;
      }
      case 'backref':
        throw new Error('Back-references need the recursive matcher');
    }
  }

  /** Evaluate a zero-width node (anchor or assertion) at a position. */
  private zeroWidth(node: Node, pos: number): boolean {
    return this.m(node, pos, [], (p) => ({ end: p, groups: [] })) !== null;
  }

  /** Get (computing if needed) the result table for a subject string. */
  /**
   * The results table for a subject, computed (backwards from the end) for
   * every position from 'from' on; positions before that aren't needed yet.
   */
  private table(chars: string[], from: number): IResult[][] {
    let n = chars.length;
    let c = this.cache;
    if(!c || c.chars !== chars) {
      c = this.cache = { chars: chars, results: this.states.map(() => new Array(n + 1)), from: n + 1 };
    }
    for(let p = c.from - 1; p >= from; p--) {
      for(let st of this.states) this.evalState(c.results, st, p);
    }
    if(from < c.from) c.from = from;
    return c.results;
  }

  private evalState(results: IResult[][], st: NState, p: number): IResult {
    let row = results[st.id];
    let v = row[p];
    if(v !== undefined) return v === IN_PROGRESS ? null : v;
    row[p] = IN_PROGRESS;
    let r: IResult = null;
    let s = this.s;
    switch(st.kind) {
      case 'match':
        r = { end: p, groups: [] };
        break;
      case 'char':
        if(p < s.length && st.test(s[p])) r = this.evalState(results, st.next, p + 1);
        break;
      case 'lit': {
        let end = this.matchLit(st.text, p);
        if(end >= 0) r = this.evalState(results, st.next, end);
        break;
      }
      case 'split':
        r = this.choose(this.evalState(results, st.next, p), this.evalState(results, st.alt, p), st.shortest);
        break;
      case 'eps':
        r = this.evalState(results, st.next, p);
        break;
      case 'assert':
        if(st.check(p)) r = this.evalState(results, st.next, p);
        break;
      case 'gend': {
        // Results are built backwards, so captures from later iterations of
        // a group are already present and win; otherwise note the end, and
        // the matching gstart fills in the start.
        let next = this.evalState(results, st.next, p);
        if(next) {
          if(next.groups[st.idx]) r = next;
          else { let g = next.groups.slice(); g[st.idx] = [-1, p]; r = { end: next.end, groups: g }; }
        }
        break;
      }
      case 'gstart': {
        let next = this.evalState(results, st.next, p);
        if(next) {
          let cur = next.groups[st.idx];
          if(cur && cur[0] == -1) { let g = next.groups.slice(); g[st.idx] = [p, cur[1]]; r = { end: next.end, groups: g }; }
          else r = next;
        }
        break;
      }
    }
    row[p] = r;
    return r;
  }

  private toMatch(chars: string[], start: number, r: IResult): Match {
    // Convert character positions to string (UTF-16) positions.
    let offset = (i: number) => chars.slice(0, i).join('').length;
    let mk = (s: number, e: number): IMatchGroup => {
      let text = chars.slice(s, e).join('');
      return { value: text, index: offset(s), length: text.length };
    };
    let m = new Match();
    let whole = mk(start, r.end);
    m.value = whole.value;
    m.index = whole.index;
    m.length = whole.length;
    m.groups = [whole];
    for(let i = 1; i <= this.groupCount; i++) {
      let g = r.groups[i];
      m.groups.push(g ? mk(g[0], g[1]) : undefined);
    }
    return m;
  }

  /** Pick between two results: the longer (or shorter) wins; ties go to a. */
  private choose(a: IResult, b: IResult, shortest: boolean): IResult {
    if(!a) return b;
    if(!b) return a;
    if(shortest) return b.end < a.end ? b : a;
    return b.end > a.end ? b : a;
  }

  /**
   * Match 'node' at 'pos', then the continuation k.
   */
  private m(node: Node, pos: number, groups: Groups, k: Cont): IResult {
    let s = this.s;
    switch(node.type) {
      case 'lit': {
        let end = this.matchLit(node.text, pos);
        return end < 0 ? null : k(end, groups);
      }

      case 'set': {
        if(pos >= s.length) return null;
        let c = s[pos];
        let ok = node.test(c) || (this.flags.noCase && (node.test(c.toLowerCase()) || node.test(c.toUpperCase())));
        return ok ? k(pos + 1, groups) : null;
      }

      case 'any':
        return pos < s.length ? k(pos + 1, groups) : null;

      case 'bol': return pos == 0 ? k(pos, groups) : null;
      case 'eol': return pos == s.length ? k(pos, groups) : null;

      case 'wordStart': case 'wordEnd': case 'wordBound': case 'nonWordBound': {
        let before = pos > 0 && isWordChar(s[pos - 1]);
        let after = pos < s.length && isWordChar(s[pos]);
        let ok = node.type == 'wordStart' ? (!before && after)
          : node.type == 'wordEnd' ? (before && !after)
          : node.type == 'wordBound' ? (before != after)
          : (before == after);
        return ok ? k(pos, groups) : null;
      }

      case 'seq':
        return this.seq(node.items, 0, pos, groups, k);

      case 'alt': {
        let best: IResult = null;
        for(let opt of node.options) {
          best = this.choose(best, this.m(opt, pos, groups, k), this.flags.min);
        }
        return best;
      }

      case 'group': {
        if(node.index == 0) return this.m(node.body, pos, groups, k);
        let idx = node.index;
        return this.m(node.body, pos, groups, (p, g) => {
          let g2 = g.slice();
          g2[idx] = [pos, p];
          return k(p, g2);
        });
      }

      case 'repeat':
        return this.rep(node, 0, pos, groups, k);

      case 'backref': {
        let g = groups[node.n];
        let text = g ? s.slice(g[0], g[1]).join('') : '';
        let end = this.matchLit(text, pos);
        return end < 0 ? null : k(end, groups);
      }

      case 'assert': {
        let found: IResult = null;
        if(!node.behind) {
          found = this.m(node.body, pos, groups, (p, g) => ({ end: p, groups: g }));
        } else {
          for(let start = pos; start >= 0 && !found; start--) {
            found = this.m(node.body, start, groups, (p, g) => p == pos ? { end: p, groups: g } : null);
          }
        }
        if(node.negate) return found ? null : k(pos, groups);
        return found ? k(pos, found.groups) : null;
      }
    }
  }

  private seq(items: Node[], i: number, pos: number, groups: Groups, k: Cont): IResult {
    if(i == items.length) return k(pos, groups);
    return this.m(items[i], pos, groups, (p, g) => this.seq(items, i + 1, p, g, k));
  }

  /** Match a repeat node, having matched 'count' repetitions so far. */
  private rep(node: IRepeat, count: number, pos: number, groups: Groups, k: Cont): IResult {
    // Fast path for repeating a single-character item (., %w, [a-z],
    // a literal character...): find the run of matching characters with
    // a loop, then try the continuation after each possible count, in
    // order of preference. This keeps the stack shallow on long strings.
    let single = this.singleCharTest(node.body);
    if(single && count == 0) {
      let s = this.s;
      let n = 0;
      while(n < node.max && pos + n < s.length && single(s[pos + n])) n++;
      if(n < node.min) return null;
      let best: IResult = null;
      if(node.lazy) {
        for(let c = node.min; c <= n; c++) best = this.choose(best, k(pos + c, groups), true);
      } else {
        for(let c = n; c >= node.min; c--) best = this.choose(best, k(pos + c, groups), this.flags.min);
      }
      return best;
    }

    let more = (): IResult => {
      if(count >= node.max) return null;
      return this.m(node.body, pos, groups, (p, g) => {
        // An iteration that matched nothing can't make progress.
        if(p == pos && count >= node.min) return null;
        return this.rep(node, count + 1, p, g, k);
      });
    };
    if(count < node.min) return more();
    let stop = (): IResult => k(pos, groups);
    if(node.lazy) return this.choose(stop(), more(), true);
    return this.choose(more(), stop(), this.flags.min);
  }

  /**
   * If a node always matches exactly one character, return a test for
   * that character; otherwise null.
   */
  private singleCharTest(node: Node): CharTest {
    let noCase = this.flags.noCase;
    switch(node.type) {
      case 'any': return () => true;
      case 'set': {
        let t = node.test;
        return noCase ? (c) => t(c) || t(c.toLowerCase()) || t(c.toUpperCase()) : t;
      }
      case 'lit': {
        let chars = Array.from(node.text);
        if(chars.length != 1) return null;
        let ch = chars[0];
        if(!noCase) return (c) => c === ch;
        // With case folding, only characters that fold to one character
        // can be matched one at a time.
        let f = fold(ch);
        if(Array.from(f).length != 1) return null;
        return (c) => fold(c) === f;
      }
    }
    return null;
  }

  /**
   * Match literal text at pos, with case folding if <NoCase>.
   * @returns End position, or -1
   */
  // Literals' characters and case-folded forms (computed once).
  private lits = new Map<string, { chars: string[], folded: string }>();

  private matchLit(text: string, pos: number): number {
    let s = this.s;
    let lit = this.lits.get(text);
    if(!lit) {
      let chars = Array.from(text);
      lit = { chars: chars, folded: chars.map(fold).join('') };
      this.lits.set(text, lit);
    }
    let t = lit.chars;
    if(!this.flags.noCase) {
      for(let i = 0; i < t.length; i++) if(s[pos + i] !== t[i]) return -1;
      return pos + t.length;
    }
    // Compare case-folded text; subject characters may fold to several.
    let want = lit.folded;
    let got = '';
    let i = pos;
    while(got.length < want.length && i < s.length) got += fold(s[i++]);
    return got == want ? i : -1;
  }
}
