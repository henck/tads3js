import { RootObject } from '../metaclass/RootObject';
import { MetaclassRegistry } from '../metaclass/MetaclassRegistry'
import { VmData, VmObject, VmNativeCode, VmNil, VmInt, VmProp, VmSstring, VmEnum, VmList } from "../types";
import { SourceImage } from "../SourceImage";
import { Pool } from "../Pool";
import { Heap } from "../Heap";
import { Symbols } from "../Symbols";
import { Vm } from "../Vm";
import { VmRuntimeError, VmErr } from "../VmErrors";
import { Dictionary } from "./Dictionary";
import { TadsObject } from "./TadsObject";

// Token slot types (GramTokTypeXxx).
const PROD = 1, SPEECH = 2, LITERAL = 3, TOKENUM = 4, STAR = 5, NSPEECH = 6;

/** A token slot in an alternative. */
interface IGramTok {
  prop: number;   // target property (0 for none)
  type: number;
  info: any;      // PROD: object ID; SPEECH: property; LITERAL: string;
                  // TOKENUM: enum value; STAR: null; NSPEECH: properties
}

/** An alternative: a sequence of token slots. */
interface IGramAlt {
  score: number;
  badness: number;
  matchObj: number;   // match object class
  toks: IGramTok[];
}

/** What matched one token slot of an alternative. */
type Item = { tok: number, matchValue: VmData } | { match: IMatch } | { star: true };

/** A match of an alternative (before match objects are created). */
interface IMatch {
  alt: IGramAlt;
  start: number;      // token position where the match starts (0-based)
  items: Item[];      // one per token slot
}

/** A partial match of an alternative, in the parser's work queue. */
interface IState {
  prod: GrammarProd;
  alt: IGramAlt;
  altPos: number;     // next token slot to match
  tokPos: number;     // next input token
  start: number;
  items: Item[];
  enclosing: IState;  // the state waiting for this sub-production, if any
  badness: number;
}

/** Context for one parseTokens() call. */
interface IParse {
  toks: VmData[];            // the input tokens ([value, type, ...] lists)
  dict: Dictionary;
  props: Set<number>[];      // per token, the dictionary properties it's defined under
  work: IState[];
  deferred: IState[];        // states with more badness than currently allowed
  success: IMatch[];
  ends: Map<string, Set<number>>;   // memo for ends()
  inProgress: Set<string>;
}

/** Limit on parser states processed by one parseTokens() call. */
const MAX_STATES = 1000000;

/**
 * GrammarProd: a grammar production, the parser of the grammar statement.
 *
 * parseTokens() follows the reference VM's algorithm: a queue of partial
 * matches (states), each working through one alternative; a sub-production
 * slot enqueues states for the sub-production's alternatives, and when one
 * of those completes, a copy of the enclosing state continues after it.
 * Left-recursive ("circular") alternatives, whose first slot is the
 * production itself, are tried only after a match of the production, with
 * that match as the first slot. States for alternatives with badness are
 * put aside, and only when the other states run out without finding a
 * match are the ones with the lowest badness taken up (and so on, until
 * there's a match).
 */
class GrammarProd extends RootObject {
  private alts: IGramAlt[] = [];

  constructor() {
    super();
  }

  /**
   * Image data: UINT2 alternative count, then each alternative: INT2 score,
   * INT2 badness, UINT4 match object, UINT2 token count, then each token
   * slot: UINT2 target property, UINT1 type, and type-specific data.
   */
  static loadFromImage(image: SourceImage, dataPool: Pool, offset: number): RootObject {
    let prod = new GrammarProd();
    let n = image.getUInt16(offset); offset += 2;
    for(let i = 0; i < n; i++) {
      let alt: IGramAlt = {
        score: image.getInt16(offset),
        badness: image.getInt16(offset + 2),
        matchObj: image.getUInt32(offset + 4),
        toks: [],
      };
      let ntoks = image.getUInt16(offset + 8);
      offset += 10;
      for(let j = 0; j < ntoks; j++) {
        let tok: IGramTok = { prop: image.getUInt16(offset), type: image.getUInt8(offset + 2), info: null };
        offset += 3;
        switch(tok.type) {
          case PROD: case TOKENUM:
            tok.info = image.getUInt32(offset); offset += 4;
            break;
          case SPEECH:
            tok.info = image.getUInt16(offset); offset += 2;
            break;
          case LITERAL: {
            let len = image.getUInt16(offset);
            tok.info = image.getUTF8String(offset + 2, len);
            offset += 2 + len;
            break;
          }
          case NSPEECH: {
            let cnt = image.getUInt16(offset); offset += 2;
            tok.info = [];
            for(let k = 0; k < cnt; k++) { tok.info.push(image.getUInt16(offset)); offset += 2; }
            break;
          }
        }
        alt.toks.push(tok);
      }
      prod.alts.push(alt);
    }
    return prod;
  }

  getMethodByIndex(idx: number): VmNativeCode {
    switch(idx) {
      case 0: return new VmNativeCode("GrammarProd.parseTokens", this.parseTokens, 2);
      case 1: return new VmNativeCode("GrammarProd.getGrammarInfo", this.getGrammarInfo, 0);
      case 2: return new VmNativeCode("GrammarProd.addAlt", this.addAlt, 2, 2);
      case 3: return new VmNativeCode("GrammarProd.deleteAlt", this.deleteAlt, 1, 1);
      case 4: return new VmNativeCode("GrammarProd.clearAlts", this.clearAlts, 0, 1);
    }
    return null;
  }

  getValue() {
    return this.alts;
  }

  public gcRefs(mark: (id: number) => void) {
    super.gcRefs(mark);
    for(let alt of this.alts) {
      mark(alt.matchObj);
      for(let t of alt.toks) if(t.type == PROD) mark(t.info);
    }
  }

  // Parsing

  /**
   * parseTokens(tokenList, dict): match a token list against the grammar.
   * Returns a list of match trees, one for each way the whole token list
   * matches (or matches up to a '*').
   */
  private parseTokens(vmToks: VmData, vmDict: VmData): VmData {
    let toks = GrammarProd.elements(vmToks);
    let dict: Dictionary = null;
    if(vmDict instanceof VmObject) {
      let d = vmDict.getInstance();
      if(!(d instanceof Dictionary)) throw new VmRuntimeError(VmErr.BAD_TYPE_BIF);
      dict = d;
    }
    let p: IParse = { toks: toks, dict: dict, props: [], work: [], deferred: [], success: [],
                      ends: new Map(), inProgress: new Set() };

    this.enqueueAlts(p, this, 0, null, null);
    let count = 0;
    for(;;) {
      while(p.work.length) {
        if(++count > MAX_STATES) throw new Error('GrammarProd.parseTokens: grammar too complex');
        this.process(p, p.work.pop());   // (the work queue is a stack)
      }
      if(p.success.length || p.deferred.length == 0) break;
      // No match yet: take up the states with the least badness.
      let least = Math.min(...p.deferred.map((s) => s.badness));
      let ready = p.deferred.filter((s) => s.badness == least);
      p.deferred = p.deferred.filter((s) => s.badness != least);
      // (They're taken up oldest first, as in the reference VM.)
      p.work.push(...ready.reverse());
    }

    // Matches are listed most recently found first.
    p.success.reverse();
    return new VmList(p.success.map((m) => this.buildTree(m, vmToks, toks)));
  }

  /** Add states for the alternatives of a production. */
  private enqueueAlts(p: IParse, prod: GrammarProd, start: number, enclosing: IState, circular: IMatch, circEnd = 0) {
    for(let alt of prod.alts) {
      let first = alt.toks[0];
      let isCircular = first !== undefined && first.type == PROD && first.info == prod.id;
      if(isCircular != (circular !== null)) continue;
      // Skip an alternative that starts with a token slot the next token
      // doesn't match (just an optimization: it would fail anyway).
      if(!circular && first !== undefined && first.type != PROD && first.type != STAR
         && (start >= p.toks.length || this.matchToken(p, first, start) === null)) continue;
      // Likewise, skip one that can't match the tokens from here at all.
      if(!circular) {
        let e = this.seqEnds(p, alt, 0, start);
        if(e !== null && e.size == 0) continue;
      }
      let state: IState = {
        prod: prod, alt: alt, altPos: 0, tokPos: start, start: start, items: [],
        enclosing: enclosing, badness: alt.badness,
      };
      if(circular) {
        state.altPos = 1;
        state.tokPos = circEnd;
        state.items = [{ match: circular }];
      }
      this.enqueue(p, state);
    }
  }

  /**
   * The token positions where a match of the production starting at start
   * can end (null if that can't be determined, because of a cycle). Used
   * to avoid exploring sub-productions that can't match: this prunes only
   * states that would fail, so it doesn't change the results.
   */
  private ends(p: IParse, prod: GrammarProd, start: number): Set<number> | null {
    let key = prod.id + ':' + start;
    let known = p.ends.get(key);
    if(known) return known;
    if(p.inProgress.has(key)) return null;
    p.inProgress.add(key);
    let result = new Set<number>();
    let unknown = false;
    let add = (e: Set<number> | null, work?: number[]) => {
      if(e === null) { unknown = true; return; }
      e.forEach((x) => { if(!result.has(x)) { result.add(x); if(work) work.push(x); } });
    };
    let circular = prod.alts.filter((alt) => alt.toks.length && alt.toks[0].type == PROD && alt.toks[0].info == prod.id);
    for(let alt of prod.alts) if(!circular.includes(alt)) add(this.seqEnds(p, alt, 0, start));
    // Left-recursive alternatives continue from each end found.
    let work = Array.from(result);
    while(work.length) {
      let from = work.pop();
      for(let alt of circular) add(this.seqEnds(p, alt, 1, from), work);
    }
    p.inProgress.delete(key);
    if(unknown) return null;
    p.ends.set(key, result);
    return result;
  }

  /** The end positions of matches of an alternative's slots from slot on, starting at pos. */
  private seqEnds(p: IParse, alt: IGramAlt, slot: number, pos: number): Set<number> | null {
    let n = p.toks.length;
    let cur = new Set<number>([pos]);
    for(let i = slot; i < alt.toks.length && cur.size; i++) {
      let t = alt.toks[i];
      let next = new Set<number>();
      for(let q of Array.from(cur)) {
        if(t.type == PROD) {
          let sub = Heap.getObj(t.info);
          if(!(sub instanceof GrammarProd)) continue;
          let e = this.ends(p, sub, q);
          if(e === null) return null;
          e.forEach((x) => next.add(x));
        } else if(t.type == STAR) {
          next.add(n);
        } else if(q < n && this.matchToken(p, t, q) !== null) {
          next.add(q + 1);
        }
      }
      cur = next;
    }
    return cur;
  }

  private enqueue(p: IParse, state: IState) {
    if(state.badness > 0) p.deferred.push(state);
    else p.work.push(state);
  }

  /** Work through a state's alternative as far as possible. */
  private process(p: IParse, s: IState) {
    let n = p.toks.length;
    while(s.altPos < s.alt.toks.length) {
      let tok = s.alt.toks[s.altPos];
      if(tok.type == PROD) {
        let sub = Heap.getObj(tok.info);
        if(sub instanceof GrammarProd) this.enqueueAlts(p, sub, s.tokPos, s, null);
        return;
      }
      if(tok.type == STAR) {
        s.items.push({ star: true });
        s.tokPos = n;
        s.altPos++;
        continue;
      }
      if(s.tokPos >= n) return;
      let mv = this.matchToken(p, tok, s.tokPos);
      if(mv === null) return;
      s.items.push({ tok: s.tokPos, matchValue: mv });
      s.tokPos++;
      s.altPos++;
    }

    // The alternative is complete.
    let match: IMatch = { alt: s.alt, start: s.start, items: s.items };
    // Left-recursive alternatives can continue from this match. (The
    // order in which states are queued here, like the work queue being a
    // stack and the success list being built in reverse, matches the
    // reference VM, so matches are returned in the same order.)
    this.enqueueAlts(p, s.prod, s.start, s.enclosing, match, s.tokPos);
    if(s.enclosing) {
      let e = s.enclosing;
      this.enqueue(p, {
        prod: e.prod, alt: e.alt, altPos: e.altPos + 1, tokPos: s.tokPos, start: e.start,
        items: e.items.concat([{ match: match }]), enclosing: e.enclosing,
        badness: 0,   // (the enclosing state was already taken up)
      });
    } else if(s.tokPos == n) {
      p.success.push(match);
    }
  }

  /**
   * Match an input token against a token slot: returns the value for the
   * token match list (the comparator's match value for a literal, else
   * nil), or null if it doesn't match.
   */
  private matchToken(p: IParse, tok: IGramTok, pos: number): VmData {
    let t = p.toks[pos];
    let parts = GrammarProd.elements(t);
    let value = parts[0], type = parts[1];
    switch(tok.type) {
      case LITERAL: {
        let s = value ? value.unpack() : null;
        if(typeof(s) != 'string') return null;
        if(p.dict) return p.dict.match(s, tok.info);
        return s === tok.info ? new VmInt(1) : null;
      }
      case TOKENUM:
        return type instanceof VmEnum && type.value == tok.info ? new VmNil() : null;
      case SPEECH:
        return this.tokenProps(p, pos).has(tok.info) ? new VmNil() : null;
      case NSPEECH: {
        let props = this.tokenProps(p, pos);
        return (tok.info as number[]).some((x) => props.has(x)) ? new VmNil() : null;
      }
    }
    return null;
  }

  /** The dictionary properties the token at pos is defined under. */
  private tokenProps(p: IParse, pos: number): Set<number> {
    if(!p.props[pos]) {
      let value = GrammarProd.elements(p.toks[pos])[0];
      let s = value ? value.unpack() : null;
      p.props[pos] = p.dict && typeof(s) == 'string' ? p.dict.propsFor(s) : new Set();
    }
    return p.props[pos];
  }

  /** The elements of a list or list-like value. */
  private static elements(v: VmData): VmData[] {
    let a = v ? v.unpack() : null;
    if(Array.isArray(a)) return a;
    // A list-like object: use its length and indexing.
    if(v instanceof VmObject) {
      let vm = Vm.getInstance();
      let len = vm.callMethod(v, Symbols.get('length') as VmProp).unpack();
      let out: VmData[] = [];
      for(let i = 1; i <= len; i++) out.push(v.getind(new VmInt(i)));
      return out;
    }
    return [];
  }

  // Building the match tree

  /** Create the match objects for a successful match. */
  private buildTree(m: IMatch, vmToks: VmData, toks: VmData[]): VmData {
    // The token match list covers the tokens matched (not those skipped by '*').
    let values: VmData[] = [];
    let collect = (x: IMatch) => x.items.forEach((it) => {
      if('tok' in it) values[it.tok] = it.matchValue;
      else if('match' in it) collect(it.match);
    });
    collect(m);
    for(let i = 0; i < values.length; i++) if(!values[i]) values[i] = new VmNil();
    let matchList = new VmList(values);
    return this.buildMatch(m, vmToks, toks, matchList).obj;
  }

  private buildMatch(m: IMatch, vmToks: VmData, toks: VmData[], matchList: VmData): { obj: VmObject, first: number, last: number } {
    // (The match class's constructor is called, as for 'new'.)
    let obj = new TadsObject(new VmObject(m.alt.matchObj));
    let first = Infinity, last = -Infinity;
    m.alt.toks.forEach((tok, i) => {
      let it = m.items[i];
      let value: VmData = null;
      if('tok' in it) {
        value = GrammarProd.elements(toks[it.tok])[0] ?? new VmNil();
        first = Math.min(first, it.tok + 1);
        last = Math.max(last, it.tok + 1);
      } else if('match' in it) {
        let sub = this.buildMatch(it.match, vmToks, toks, matchList);
        value = sub.obj;
        if(sub.first <= sub.last && sub.first != Infinity) {
          first = Math.min(first, sub.first);
          last = Math.max(last, sub.last);
        }
      }
      if(tok.prop != 0 && value) obj.setprop(tok.prop, value);
    });
    let empty = first == Infinity;
    if(empty) {
      // No tokens matched: like the reference VM, first = start + 2 and
      // last = start + 1 (with start counted from 0).
      first = m.start + 2;
      last = m.start + 1;
    }
    GrammarProd.setSym(obj, 'GrammarProd.firstTokenIndex', new VmInt(first));
    GrammarProd.setSym(obj, 'GrammarProd.lastTokenIndex', new VmInt(last));
    GrammarProd.setSym(obj, 'GrammarProd.tokenList', vmToks);
    GrammarProd.setSym(obj, 'GrammarProd.tokenMatchList', matchList);
    return { obj: new VmObject(obj), first: empty ? Infinity : first, last: empty ? -Infinity : last };
  }

  private static setSym(obj: RootObject, sym: any, value: VmData) {
    let prop = Symbols.get(sym);
    if(prop instanceof VmProp) obj.setprop(prop.value, value);
  }

  // Grammar information and changes

  /** getGrammarInfo(): a list of GrammarAltInfo objects describing the alternatives. */
  private getGrammarInfo(): VmData {
    let altCls = Symbols.get('GrammarProd.GrammarAltInfo');
    let tokCls = Symbols.get('GrammarProd.GrammarAltTokInfo');
    if(!(altCls instanceof VmObject) || !(tokCls instanceof VmObject)) return new VmNil();
    return new VmList(this.alts.map((alt) => {
      let toks = alt.toks.map((t) => {
        let info: VmData;
        switch(t.type) {
          case PROD: info = new VmObject(t.info); break;
          case SPEECH: info = new VmProp(t.info); break;
          case LITERAL: info = new VmSstring(t.info); break;
          case TOKENUM: info = new VmEnum(t.info); break;
          case NSPEECH: info = new VmList((t.info as number[]).map((x) => new VmProp(x))); break;
          default: info = new VmNil();
        }
        let prop = t.prop ? new VmProp(t.prop) : new VmNil();
        return new VmObject(new TadsObject(tokCls, prop, new VmInt(t.type), info));
      });
      return new VmObject(new TadsObject(altCls, new VmInt(alt.score), new VmInt(alt.badness),
        new VmObject(alt.matchObj), new VmList(toks)));
    }));
  }

  /**
   * addAlt(alt, matchObj, dict?, symtab?): add alternatives, written as in
   * a grammar statement, with matchObj as their match object class.
   * Symbols are looked up in symtab. Sets matchObj.grammarAltProps to the
   * '->' properties used, and adds literals to dict.
   */
  private addAlt(vmAlt: VmData, vmMatchObj: VmData, vmDict?: VmData, symtab?: VmData): VmData {
    if(!(vmMatchObj instanceof VmObject)) throw new VmRuntimeError(VmErr.OBJ_VAL_REQD);
    let text = vmAlt.unpack();
    if(typeof(text) != 'string') throw new VmRuntimeError(VmErr.STRING_VAL_REQD);
    let parsed = new RuleParser(text, symtab).parse();

    this.beforeChange();
    let props: number[] = [];
    for(let a of parsed) {
      let alt: IGramAlt = { score: 0, badness: a.badness, matchObj: vmMatchObj.value, toks: a.toks };
      this.alts.push(alt);
      for(let t of a.toks) if(t.prop && !props.includes(t.prop)) props.push(t.prop);
    }
    GrammarProd.setSym(vmMatchObj.getInstance(), 'GrammarProd.altProps', new VmList(props.map((p) => new VmProp(p))));
    let dict = GrammarProd.dictArg(vmDict);
    if(dict) this.literals(parsed).forEach((lit) => dict.addWordFor(new VmObject(this.id), lit, this.miscVocab()));
    return new VmNil();
  }

  /**
   * deleteAlt(id, dict?): delete alternatives: those whose match object's
   * grammarTag is id (a string), whose match object is or inherits from id
   * (an object), or the one at index id (an integer, from 1).
   */
  private deleteAlt(id: VmData, vmDict?: VmData): VmData {
    let doomed: IGramAlt[];
    if(id instanceof VmInt) {
      if(id.value < 1 || id.value > this.alts.length) throw new VmRuntimeError(VmErr.INDEX_OUT_OF_RANGE);
      doomed = [this.alts[id.value - 1]];
    } else if(id instanceof VmObject) {
      doomed = this.alts.filter((a) => a.matchObj == id.value || id.getInstance().isAncestor(Heap.getObj(a.matchObj)));
    } else {
      let tag = id.unpack();
      let tagProp = Symbols.get('GrammarProd.grammarTag');
      doomed = this.alts.filter((a) => {
        if(!(tagProp instanceof VmProp)) return false;
        let v = Vm.getInstance().callMethod(new VmObject(a.matchObj), tagProp);
        return v.unpack() === tag;
      });
    }
    this.removeAlts(doomed, vmDict);
    return new VmNil();
  }

  /** clearAlts(dict?): delete all alternatives. */
  private clearAlts(vmDict?: VmData): VmData {
    this.removeAlts(this.alts.slice(), vmDict);
    return new VmNil();
  }

  private removeAlts(doomed: IGramAlt[], vmDict: VmData) {
    if(!doomed.length) return;
    this.beforeChange();
    this.alts = this.alts.filter((a) => !doomed.includes(a));
    // Remove literals that no remaining alternative uses from the dictionary.
    let dict = GrammarProd.dictArg(vmDict);
    if(dict) {
      let remaining = new Set(this.literals(this.alts));
      for(let lit of this.literals(doomed))
        if(!remaining.has(lit)) dict.removeWordFor(new VmObject(this.id), lit, this.miscVocab());
    }
  }

  private literals(alts: { toks: IGramTok[] }[]): string[] {
    let out: string[] = [];
    for(let a of alts) for(let t of a.toks) if(t.type == LITERAL && !out.includes(t.info)) out.push(t.info);
    return out;
  }

  private miscVocab(): number {
    let p = Symbols.get('GrammarProd.miscVocab');
    return p instanceof VmProp ? p.value : 0;
  }

  private static dictArg(v: VmData): Dictionary {
    if(v instanceof VmObject) {
      let d = v.getInstance();
      if(d instanceof Dictionary) return d;
    }
    return null;
  }
}

/** A parsed alternative from addAlt(). */
interface IParsedAlt {
  badness: number;
  toks: IGramTok[];
}

/**
 * Parser for the rule syntax of addAlt(), as in a grammar statement:
 * alternatives separated by '|', each with an optional [badness n]
 * qualifier and a sequence of items: 'literal' or "literal", a symbol (a
 * part of speech, token type or sub-production), <prop prop ...>, or a
 * parenthesized group of alternatives, each optionally followed by
 * '->prop'; and finally an optional '*'. Groups are expanded, so
 * 'a' ('b' | 'c') gives two alternatives.
 */
class RuleParser {
  private toks: string[] = [];
  private pos = 0;

  constructor(text: string, private symtab: VmData) {
    let re = /\s+|'([^']*)'?|"([^"]*)"?|->|[|()<>\[\]*]|[A-Za-z_][A-Za-z0-9_]*|-?[0-9]+|./g;
    let m: RegExpExecArray;
    while((m = re.exec(text)) !== null) {
      if(/^\s+$/.test(m[0])) continue;
      // Literals are kept with a leading quote, to tell them from symbols.
      if(m[1] !== undefined) this.toks.push("'" + m[1]);
      else if(m[2] !== undefined) this.toks.push("'" + m[2]);
      else this.toks.push(m[0]);
    }
  }

  private static fail(): never {
    throw new VmRuntimeError(VmErr.INTRINSIC_CLASS_EXCEPTION, 'intrinsic class exception: code compilation failed');
  }

  parse(): IParsedAlt[] {
    let alts = this.alternatives();
    if(this.pos < this.toks.length) RuleParser.fail();
    return alts;
  }

  /** alternatives := alternative ('|' alternative)* */
  private alternatives(): IParsedAlt[] {
    let alts = this.alternative();
    while(this.toks[this.pos] == '|') {
      this.pos++;
      alts = alts.concat(this.alternative());
    }
    return alts;
  }

  /** alternative := ['[' badness n ']'] item* ['*'] (may expand into several) */
  private alternative(): IParsedAlt[] {
    let badness = 0;
    if(this.toks[this.pos] == '[') {
      if(this.toks[this.pos + 1] != 'badness' || !/^-?[0-9]+$/.test(this.toks[this.pos + 2] ?? '') || this.toks[this.pos + 3] != ']')
        RuleParser.fail();
      badness = parseInt(this.toks[this.pos + 2]);
      this.pos += 4;
    }
    let seqs: IGramTok[][] = [[]];
    for(;;) {
      let t = this.toks[this.pos];
      if(t === undefined || t == '|' || t == ')') break;
      if(t == '*') {
        this.pos++;
        seqs.forEach((s) => s.push({ prop: 0, type: STAR, info: null }));
        break;
      }
      let options = this.item();
      let next: IGramTok[][] = [];
      for(let s of seqs) for(let o of options) next.push(s.concat(o));
      seqs = next;
    }
    return seqs.map((s) => ({ badness: badness, toks: s }));
  }

  /** item := atom ['->' prop]; returns the alternative token sequences it stands for */
  private item(): IGramTok[][] {
    let t = this.toks[this.pos++];
    let options: IGramTok[][];
    if(t[0] == "'") {
      options = [[{ prop: 0, type: LITERAL, info: t.substr(1) }]];
    } else if(t == '<') {
      let props: number[] = [];
      while(this.toks[this.pos] != '>') {
        if(this.toks[this.pos] === undefined) RuleParser.fail();
        let v = this.symbol(this.toks[this.pos++]);
        if(!(v instanceof VmProp)) RuleParser.fail();
        props.push(v.value);
      }
      this.pos++;
      options = [[{ prop: 0, type: NSPEECH, info: props }]];
    } else if(t == '(') {
      let alts = this.alternatives();
      if(this.toks[this.pos++] != ')') RuleParser.fail();
      options = alts.map((a) => a.toks);
    } else if(/^[A-Za-z_]/.test(t)) {
      let v = this.symbol(t);
      let tok: IGramTok;
      if(v instanceof VmProp) tok = { prop: 0, type: SPEECH, info: v.value };
      else if(v instanceof VmEnum) tok = { prop: 0, type: TOKENUM, info: v.value };
      else if(v instanceof VmObject && v.getInstance() instanceof GrammarProd) tok = { prop: 0, type: PROD, info: v.value };
      else RuleParser.fail();
      options = [[tok]];
    } else {
      RuleParser.fail();
    }
    if(this.toks[this.pos] == '->') {
      this.pos++;
      let v = this.symbol(this.toks[this.pos++] ?? '');
      if(!(v instanceof VmProp)) RuleParser.fail();
      // The target property applies to a single slot.
      options = options.map((o) => o.length == 1 ? [Object.assign({}, o[0], { prop: v.value })] : o);
    }
    return options;
  }

  private symbol(name: string): VmData {
    if(!/^[A-Za-z_]/.test(name) || !(this.symtab instanceof VmObject)) RuleParser.fail();
    let v = this.symtab.getInstance().getindex(new VmSstring(name));
    if(!v || v instanceof VmNil) RuleParser.fail();
    return v;
  }
}

// If #include <gramprod.h> is not given, compiler will fall back
// to 'grammar-production/030000'. We'll assume that both versions
// are the same.
MetaclassRegistry.register('grammar-production/030000', GrammarProd);
MetaclassRegistry.register('grammar-production/030002', GrammarProd);

export { GrammarProd }
