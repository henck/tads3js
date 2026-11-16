#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   A count prefix (e.g. C/a, S/l) packs the length or number of items
 *   first; unpacking reads the count, then that many units.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('S/a', 'abc') == [3, 0, 97, 98, 99]
        && P('C/C', 7, 8) == [2, 7, 8]
        && U([2, 104, 105, 120], 'C/a C') == ['hi', 120]
        && U([2, 7, 8], 'C/C') == [7, 8];
}
