#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   copyFrom(src, srcStart, dstStart, len) copies bytes (overlapping
 *   ranges in the same array are handled) and returns the array.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray(4);
    local r = a.copyFrom(new ByteArray('xy'), 1, 2, 2);
    local b = new ByteArray('abcdef');
    b.copyFrom(b, 1, 3, 4);
    local c = new ByteArray('abcdef');
    c.copyFrom(c, 3, 1, 4);
    return r == a
        && L(a) == [0, 120, 121, 0]
        && b.mapToString() == 'ababcd'
        && c.mapToString() == 'cdefef';
}
