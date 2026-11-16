/**
 * Translation of TADS formatting codes ('\n', '\b', '\^', '\v', quoted
 * spaces, <Q>, <BR HEIGHT=N>, <P> etc.) to plain text or standard HTML,
 * for String.specialsToText() and String.specialsToHtml().
 *
 * The state that carries over between calls (e.g. whether we're in the
 * middle of a line) uses the bit layout documented for the flags_
 * property of the state object.
 */

export const SF_INLINE = 0x0001;    // in the middle of a line of text
export const SF_CAPS = 0x0002;      // '\^' pending
export const SF_LOWER = 0x0004;     // '\v' pending
export const SF_TAG = 0x0008;       // HTML tag in progress
export const SF_DQUOTE = 0x0010;    // in a double-quoted attribute value
export const SF_SQUOTE = 0x0020;    // in a single-quoted attribute value
export const SF_SPACE = 0x0040;     // last character was an ordinary space
export const SF_QSPACE = 0x0080;    // last character was a quoted space
export const SF_QODD = 0x0100;      // <Q> nesting level is odd
export const SF_ENTITY = 0x0200;    // HTML entity in progress (text mode only)

// TADS special characters as stored in strings.
const CH_NEWLINE = '\n';
const CH_BLANKLINE = '\u000b';      // '\b'
const CH_CAPS = '\u000f';           // '\^'
const CH_LOWER = '\u000e';          // '\v'
const CH_QSPACE = '\u0015';         // '\ ' (quoted space)
const CH_TAB = '\t';

const BLOCK_TAGS = ['p', 'div', 'center', 'table', 'td', 'th', 'caption'];

const TEXT_ENTITIES: { [name: string]: string } = {
  nbsp: ' ', gt: '>', lt: '<', amp: '&',
  quot: '"', ldquo: '"', rdquo: '"', lsquo: '\'', rsquo: '\''
};

export interface ISpecialsState {
  flags: number;
  tag: string;     // text of a tag (or entity) in progress
}

/**
 * Translate a string's TADS formatting codes.
 * @param str String to translate
 * @param html true for HTML output, false for plain text
 * @param state State carried over from previous calls (updated in place)
 */
export function translateSpecials(str: string, html: boolean, state: ISpecialsState): string {
  let out = '';
  let flags = state.flags;
  let tag = state.tag;
  let column = 0;   // characters output on the current line (for tabs)

  let newline = html ? '<br>' : '\n';
  let lineBreak = () => { flags &= ~SF_INLINE; column = 0; };

  // Output a visible character, applying any pending \^ or \v.
  let emit = (c: string) => {
    if(flags & SF_CAPS) c = c.toUpperCase();
    else if(flags & SF_LOWER) c = c.toLowerCase();
    flags &= ~(SF_CAPS | SF_LOWER);
    out += c;
    flags |= SF_INLINE;
    column++;
  };

  // Handle a complete tag (text between < and >).
  let handleTag = (text: string) => {
    let m = /^\s*(\/?)\s*([a-zA-Z0-9]+)([\s\S]*)$/.exec(text);
    let close = m ? m[1] == '/' : false;
    let name = m ? m[2].toLowerCase() : '';
    let attrs = m ? m[3] : '';

    if(name == 'q') {
      // Alternate double and single quotes by nesting level.
      let odd = (flags & SF_QODD) != 0;
      if(close) { flags ^= SF_QODD; odd = !odd; }
      let dbl = !odd;
      if(html) out += close ? (dbl ? '&rdquo;' : '&rsquo;') : (dbl ? '&ldquo;' : '&lsquo;');
      else out += dbl ? '"' : '\'';
      if(!close) flags ^= SF_QODD;
      flags |= SF_INLINE;
      column++;
      return;
    }

    if(name == 'br') {
      let h = /height\s*=\s*['"]?(\d+)/i.exec(attrs);
      if(h) {
        let n = parseInt(h[1]) + ((flags & SF_INLINE) ? 1 : 0);
        out += newline.repeat(n);
      } else {
        out += newline;
      }
      lineBreak();
      return;
    }

    if(BLOCK_TAGS.includes(name)) {
      if(html) {
        out += '<' + text + '>';
      } else if(name == 'p') {
        out += (flags & SF_INLINE) ? '\n\n' : '\n';
      } else if(flags & SF_INLINE) {
        out += '\n';
      }
      lineBreak();
      return;
    }

    // Any other tag is left alone in HTML, and dropped in text.
    if(html) out += '<' + text + '>';
  };

  let chars = Array.from(str);
  for(let i = 0; i < chars.length; i++) {
    let c = chars[i];

    // Inside a tag: collect it up to the closing '>' (outside quotes).
    if(flags & SF_TAG) {
      if(flags & SF_DQUOTE) { if(c == '"') flags &= ~SF_DQUOTE; tag += c; continue; }
      if(flags & SF_SQUOTE) { if(c == '\'') flags &= ~SF_SQUOTE; tag += c; continue; }
      if(c == '"') { flags |= SF_DQUOTE; tag += c; continue; }
      if(c == '\'') { flags |= SF_SQUOTE; tag += c; continue; }
      if(c == '>') { flags &= ~SF_TAG; let t = tag; tag = ''; handleTag(t); continue; }
      tag += c;
      continue;
    }

    // Inside an entity (text mode): collect it up to ';'.
    if(flags & SF_ENTITY) {
      if(c == ';') {
        flags &= ~SF_ENTITY;
        let name = tag; tag = '';
        // Unknown entities are reduced to their name, like the reference VM.
        emit(TEXT_ENTITIES[name.toLowerCase()] ?? name);
      } else {
        tag += c;
      }
      continue;
    }

    let wasSpace = (flags & SF_SPACE) != 0;
    let wasQSpace = (flags & SF_QSPACE) != 0;
    flags &= ~(SF_SPACE | SF_QSPACE);

    switch(c) {
      case '<':
        flags |= SF_TAG;
        tag = '';
        break;

      case '&':
        if(html) { out += c; flags |= SF_INLINE; column++; }
        else { flags |= SF_ENTITY; tag = ''; }
        break;

      case CH_NEWLINE:
        if(flags & SF_INLINE) out += newline;
        lineBreak();
        break;

      case CH_BLANKLINE:
        out += (flags & SF_INLINE) ? newline + newline : newline;
        lineBreak();
        break;

      case CH_CAPS:
        flags = (flags | SF_CAPS) & ~SF_LOWER;
        break;

      case CH_LOWER:
        flags = (flags | SF_LOWER) & ~SF_CAPS;
        break;

      case CH_QSPACE:
        if(html) {
          // An ordinary space just before a quoted space is dropped.
          if(wasSpace && out.endsWith(' ')) { out = out.slice(0, -1); column--; }
          out += (chars[i + 1] == CH_QSPACE) ? '&nbsp;' : ' ';
        } else {
          out += ' ';
        }
        flags |= SF_QSPACE | SF_INLINE;
        column++;
        break;

      case ' ':
        // In HTML, ordinary spaces after a quoted space are dropped.
        if(html && wasQSpace) { flags |= SF_QSPACE; break; }
        out += ' ';
        flags |= SF_SPACE | SF_INLINE;
        column++;
        break;

      case CH_TAB:
        if(html) {
          // Pad with non-breaking spaces and one ordinary space. (This
          // replicates the column arithmetic of the reference VM.)
          let n = 4 - ((column + 1) % 4);
          out += '&nbsp;'.repeat(Math.max(n - 1, 0)) + ' ';
          column += n;
          flags |= SF_INLINE;
        } else {
          out += c;
          flags |= SF_INLINE;
          column++;
        }
        break;

      default:
        emit(c);
    }
  }

  state.flags = flags;
  state.tag = tag;
  return out;
}
