import { ENTITIES } from "./Entities";

/** Kinds of cell in the line buffer. */
const enum Kind {
  CHAR,     // a visible character (a non-breaking space counts as one)
  SPACE,    // an ordinary space: combined with adjacent spaces, trimmed
  TSPACE,   // a typographical or quoted space: replaces adjacent ordinary spaces
  QSPACE,   // a space from a tab: doesn't replace a preceding ordinary space
  GLUE,     // zero-width non-breaking space: no line break on either side
  ZWSP,     // zero-width space: a line break may occur here
  SHY,      // soft hyphen: a line break may occur here, shown as '-'
}

interface ICell {
  kind: Kind;
  text: string;       // what is displayed ('' for zero-width cells)
  charWrap: boolean;  // added in character-wrapping mode
}

// Control characters in TADS strings.
const NEWLINE = '\n';      // \n
const BLANK_LINE = '\x0b'; // \b
const TAB = '\t';          // \t
const CAPS = '\x0f';       // \^
const NOCAPS = '\x0e';     // \v
const QSPACE = '\x15';     // '\ ' (quoted space)

// Typographical spaces, and how many columns each takes in text mode.
const TYPO_SPACES = new Map<number, number>([
  [0x2002, 2], [0x2003, 3], [0x2004, 1], [0x2005, 1], [0x2006, 1],
  [0x2007, 1], [0x2008, 1], [0x2009, 1], [0x200A, 1],
]);

const LETTER = new RegExp('\\p{L}', 'u');

/**
 * The text-mode output formatter, following the reference console
 * interpreter (t3run -plain): it interprets the HTML subset that text-mode
 * interpreters support, combines spaces and newlines, applies \^ and \v,
 * and wraps lines at the window width.
 */
export class TextFormatter {
  private write: (text: string) => void;
  private width: number;
  private line: ICell[] = [];

  private caps = false;
  private nocaps = false;
  private quoteLevel = 0;
  private pre = false;
  private hidden: string = null;   // inside <title> or <aboutbox>: the tag name
  private charWrap = false;

  // Markup that may continue into the next say() call.
  private tag: string = null;      // text of a tag being read, after '<'
  private entity: string = null;   // text of an entity being read, after '&'

  /**
   * @param write Where formatted text goes ('
' ends a line)
   * @param width Line width (lines hold at most width - 1 characters)
   */
  /**
   * Tags whose names start with "x-" (e.g. <x-ui image="beach.jpg">) aren't
   * displayed: they go to this callback, with their attributes (entities in
   * the values decoded). A game can use them to send data to a custom
   * presentation; other interpreters ignore them.
   */
  public extTag: (name: string, attrs: Map<string, string>, end: boolean) => void = null;

  /** Hide <banner> tags and their contents (HTML mode: they go to banner windows). */
  public hideBanners = false;

  constructor(write: (text: string) => void, width = 80) {
    this.write = write;
    this.width = width;
  }

  /** Display a string. */
  say(str: string) {
    for(let c of Array.from(str)) this.putRaw(c);
  }

  /** Before reading input: show the partial line as it is. */
  flushPartial() {
    this.write(this.line.map((c) => c.text).join(''));
    this.line = [];
  }

  /** Remove trailing spaces from the current line (as clearing the screen does). */
  trimPartial() {
    this.line = TextFormatter.trimEnd(this.line);
  }

  /** At the end of the program: end the current line. */
  finish() {
    if(this.line.length) this.endLine();
  }

  // Markup parsing

  private putRaw(c: string) {
    if(this.tag !== null) {
      // A tag ends at the first '>' (like the reference VM, comments get
      // no special treatment).
      if(c == '>') {
        let tag = this.tag;
        this.tag = null;
        this.processTag(tag);
      } else {
        this.tag += c;
      }
      return;
    }
    if(this.entity !== null) {
      if(/[A-Za-z0-9#]/.test(c)) { this.entity += c; return; }
      let name = this.entity;
      this.entity = null;
      let code = this.entityCode(name);
      if(code === null) {
        this.putText('&' + name + (c == ';' ? ';' : ''));
      } else {
        this.putChar(String.fromCodePoint(code));
      }
      if(c != ';') this.putRaw(c);
      return;
    }
    if(c == '<') { this.tag = ''; return; }
    if(c == '&') { this.entity = ''; return; }
    this.putChar(c);
  }

  private entityCode(name: string): number {
    let m = /^#(x[0-9a-fA-F]+|[0-9]+)$/.exec(name);
    if(m) return m[1][0] == 'x' ? parseInt(m[1].substr(1), 16) : parseInt(m[1], 10);
    let code = ENTITIES.get(name);
    return code === undefined ? null : code;
  }

  private putText(s: string) {
    for(let c of Array.from(s)) this.putChar(c);
  }

  private processTag(text: string) {
    let m = /^\s*(\/?)([A-Za-z0-9-]*)([\s\S]*)$/.exec(text);
    let end = m[1] == '/';
    let name = m[2].toLowerCase();
    let attrs = TextFormatter.parseAttrs(m[3]);

    // Text-mode interpreters hide the title and the "about box", along with
    // any markup inside them.
    if(this.hidden) {
      if(end && name == this.hidden) this.hidden = null;
      return;
    }

    if(name.startsWith('x-')) {
      if(this.extTag) {
        let decoded = new Map<string, string>();
        attrs.forEach((v, k) => decoded.set(k, v.replace(/&([A-Za-z0-9#]+);/g, (s, e) => {
          let code = this.entityCode(e);
          return code === null ? s : String.fromCodePoint(code);
        })));
        this.extTag(name, decoded, end);
      }
      return;
    }

    switch(name) {
      case 'br': {
        let height = attrs.get('height');
        if(height === undefined) { this.endLine(); break; }
        let n = parseInt(height) || 0;
        if(this.line.length) this.endLine();
        for(let i = 0; i < n; i++) this.write('\n');
        break;
      }
      case 'p':
        this.paragraph();
        break;
      case 'pre':
        this.endLine();
        this.paragraph();
        this.pre = !end;
        break;
      case 'hr':
        if(this.line.length) this.endLine();
        this.write('-'.repeat(Math.min(this.width, 80) - 1) + '\n');
        this.paragraph();
        break;
      case 'q':
        if(end) {
          if(this.quoteLevel > 0) this.quoteLevel--;
          this.putChar(this.quoteLevel % 2 == 0 ? '”' : '’');
        } else {
          this.putChar(this.quoteLevel % 2 == 0 ? '“' : '‘');
          this.quoteLevel++;
        }
        break;
      case 'title': case 'aboutbox':
        if(!end) this.hidden = name;
        break;
      case 'banner':
        if(!end && this.hideBanners && !attrs.has('remove') && !attrs.has('removeall')) this.hidden = name;
        break;
      case 'img': {
        let alt = attrs.get('alt');
        if(alt) this.putText(alt);
        break;
      }
      case 'tab': {
        let n = parseInt(attrs.get('indent') ?? attrs.get('multiple') ?? '0') || 0;
        for(let i = 0; i < n; i++) this.addCell(Kind.QSPACE, ' ');
        break;
      }
      case 'wrap':
        if(attrs.has('char')) this.charWrap = true;
        if(attrs.has('word')) this.charWrap = false;
        break;
    }
  }

  /** Attributes of a tag (names in lower case; a bare name has value ''). */
  private static parseAttrs(text: string): Map<string, string> {
    let attrs = new Map<string, string>();
    let re = /([A-Za-z0-9_-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"']*))?/g;
    let m: RegExpExecArray;
    while((m = re.exec(text)) !== null) {
      let v = m[2] ?? '';
      if(/^["']/.test(v)) v = v.substr(1, v.length - 2);
      attrs.set(m[1].toLowerCase(), v);
    }
    return attrs;
  }

  // Characters

  private putChar(c: string) {
    if(this.hidden) return;
    let code = c.codePointAt(0);

    if(this.pre) {
      if(c == NEWLINE) { this.endLine(); return; }
      if(c == ' ') { this.addCell(Kind.QSPACE, ' '); return; }
    }

    switch(c) {
      case NEWLINE:
        if(this.line.length) this.endLine();
        return;
      case BLANK_LINE:
        this.paragraph();
        return;
      case CAPS:
        this.caps = true; this.nocaps = false;
        return;
      case NOCAPS:
        this.nocaps = true; this.caps = false;
        return;
      case TAB:
        // Pad to the next tab stop (every four columns).
        do { this.addCell(Kind.QSPACE, ' '); } while((this.lineWidth() + 1) % 4 != 0);
        return;
      case QSPACE:
        this.addCell(Kind.TSPACE, ' ');
        return;
      case ' ':
        this.addCell(Kind.SPACE, ' ');
        return;
      case ' ':
        this.addCell(Kind.CHAR, ' ');
        return;
      case '﻿':
        this.addCell(Kind.GLUE, '');
        return;
      case '​':
        this.addCell(Kind.ZWSP, '');
        return;
      case '­':
        this.addCell(Kind.SHY, '');
        return;
      case '\r':
        return;
    }
    if(TYPO_SPACES.has(code)) {
      for(let i = 0; i < TYPO_SPACES.get(code); i++) this.addCell(Kind.TSPACE, ' ');
      return;
    }

    if(LETTER.test(c)) {
      if(this.caps) c = c.toUpperCase();
      else if(this.nocaps) c = c.toLowerCase();
      this.caps = this.nocaps = false;
    }
    this.addCell(Kind.CHAR, c);
  }

  // The line buffer

  private static isSpace(cell: ICell): boolean {
    return cell.kind == Kind.SPACE || cell.kind == Kind.TSPACE || cell.kind == Kind.QSPACE;
  }

  private lineWidth(cells: ICell[] = this.line): number {
    let n = 0;
    for(let c of cells) n += c.text.length;
    return n;
  }

  private addCell(kind: Kind, text: string) {
    let last = this.line[this.line.length - 1];
    if(kind == Kind.SPACE) {
      // No ordinary spaces at the start of a line, next to another space.
      if(!this.line.some((c) => c.text != '')) return;
      if(last && TextFormatter.isSpace(last)) return;
    }
    if(kind == Kind.TSPACE) {
      // A typographical space replaces adjacent ordinary spaces.
      while(this.line.length && this.line[this.line.length - 1].kind == Kind.SPACE) this.line.pop();
    }
    this.line.push({ kind: kind, text: text, charWrap: this.charWrap });
    if(kind == Kind.CHAR && this.lineWidth() > this.width - 1) this.wrap();
  }

  /** Can the line break between cells i-1 and i? */
  private canBreak(i: number): boolean {
    let a = this.line[i - 1], b = this.line[i];
    if(a.kind == Kind.GLUE || b.kind == Kind.GLUE) return false;
    if(TextFormatter.isSpace(a)) return !TextFormatter.isSpace(b);
    if(a.kind == Kind.ZWSP || a.kind == Kind.SHY) return true;
    if(a.text == '-' && b.text != '-' && !TextFormatter.isSpace(b)) return true;
    return b.charWrap && a.kind == Kind.CHAR && b.kind == Kind.CHAR;
  }

  /** The line is too long: break it at the last possible place that fits. */
  private wrap() {
    let max = this.width - 1;
    let at = -1;
    for(let i = this.line.length - 1; i > 0; i--) {
      if(!this.canBreak(i)) continue;
      let head = this.line.slice(0, i);
      let shy = head[head.length - 1].kind == Kind.SHY ? 1 : 0;
      if(this.lineWidth(TextFormatter.trimEnd(head)) + shy <= max) { at = i; break; }
    }
    if(at < 0) {
      // No place to break: break the word at the margin.
      let w = 0;
      at = 0;
      while(at < this.line.length && w + this.line[at].text.length <= max) w += this.line[at++].text.length;
    }
    let head = this.line.slice(0, at);
    let rest = this.line.slice(at);
    let text = this.render(head);
    if(head.length && head[head.length - 1].kind == Kind.SHY) text += '-';
    this.write(text + '\n');
    while(rest.length && rest[0].kind == Kind.SPACE) rest.shift();
    this.line = rest;
  }

  /** Remove trailing spaces (but not those before a non-breaking space). */
  private static trimEnd(cells: ICell[]): ICell[] {
    let n = cells.length;
    while(n > 0 && (TextFormatter.isSpace(cells[n - 1]) || cells[n - 1].kind == Kind.ZWSP || cells[n - 1].kind == Kind.SHY)) n--;
    return cells.slice(0, n);
  }

  private render(cells: ICell[]): string {
    return TextFormatter.trimEnd(cells).map((c) => c.text).join('');
  }

  /** End the current line (even if it's empty). */
  private endLine() {
    this.write(this.render(this.line) + '\n');
    this.line = [];
  }

  /** \b and <p>: end the current line, if any, and add a blank line. */
  private paragraph() {
    if(this.line.length) this.endLine();
    this.write('\n');
  }
}
