#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   k packs an unsigned integer in base-128 digits, most significant
 *   first, with the high bit set on all but the last byte.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('k', 300) == [130, 44]
        && P('k', 5) == [5]
        && P('k', 0) == [0]
        && U([130, 44], 'k') == [300]
        && U([5, 130, 44], 'k2') == [5, 300];
}
