#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   x packs null bytes (or skips on unpack), X moves back, @ moves to an
 *   offset in the group, @? returns the current offset; "text" and
 *   {hex} pack literal bytes (and are skipped on unpack).
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('x3 "AB" {4142}') == [0, 0, 0, 65, 66, 65, 66]
        && P('C @3 C', 1, 2) == [1, 0, 0, 2]
        && P('C C X C', 1, 2, 9) == [1, 9]
        && P('C x4! C', 1, 2) == [1, 0, 0, 0, 2]
        && U([1, 2, 3], 'x2 C') == [3]
        && U([1, 2, 3], 'C2 @?') == [1, 2, 2]
        && U([1, 2, 3], '@2 C') == [3]
        && U([65, 66, 7], '"AB" C') == [7];
}
