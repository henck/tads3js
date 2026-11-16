#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   subarray(start, len?) returns a new ByteArray with part of the bytes
 *   (a length past the end is clamped).
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray('abcd');
    local s = a.subarray(2, 2);
    s[1] = 0;
    return L(s) == [0, 99]
        && L(a.subarray(3)) == [99, 100]
        && L(a) == [97, 98, 99, 100]
        && L(a.subarray(4, 3)) == [100];         // clamped to the end
}
