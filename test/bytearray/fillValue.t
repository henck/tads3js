#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   fillValue(val, start?, len?) stores val in the whole array, from
 *   start, or for len bytes, and returns the array.
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
    local r = a.fillValue(9);
    local b = new ByteArray(4);
    b.fillValue(1, 3);
    local c = new ByteArray(4);
    c.fillValue(2, 2, 2);
    return r == a
        && L(a) == [9, 9, 9, 9]
        && L(b) == [0, 0, 1, 1]
        && L(c) == [0, 2, 2, 0]
        && errnoOf({: a.fillValue(300) }) == 2027;
}
