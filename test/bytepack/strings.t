#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   String types: a (Latin-1, null-padded), A (space-padded), b (bytes),
 *   u/U (UTF-8), w/W (UCS-2, length in characters), h/H (hex digits,
 *   low/high nibble first). The count is a length (default 1); * means the
 *   whole string; a leading 0 adds a null terminator. A character that
 *   doesn't fit in a byte is packed as '?'.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('a', 'hello') == [104]
        && P('a3', 'he') == [104, 101, 0]
        && P('A3', 'he') == [104, 101, 32]
        && P('a*', 'hello') == [104, 101, 108, 108, 111]
        && P('a2', 'hello') == [104, 101]
        && P('a0', 'hi') == [104, 105, 0]
        && P('a03', 'hi') == [104, 105, 0, 0]
        && P('u*', 'é') == [195, 169]
        && P('b*', new ByteArray('xy')) == [120, 121]
        && P('w', 'ab') == [97, 0]
        && P('w>2', 'ab') == [0, 97, 0, 98]
        && P('W3', 'ab') == [97, 0, 98, 0, 32, 0]
        && P('H4', '4142') == [65, 66]
        && P('h2', '14') == [65]
        && P('a*', 'Ā') == [63];           // unmappable: '?'
}
