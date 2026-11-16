#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   arr[i] reads and writes bytes, with reference semantics; values
 *   outside 0..255 are "value is out of range" (2027), and indices
 *   outside the array "index out of range" (2015).
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray(3);
    local b = a;
    a[1] = 200;
    b[3] = 7;
    return a[1] == 200 && a[3] == 7 && a.length() == 3
        && errnoOf(function() { a[1] = 300; }) == 2027
        && errnoOf(function() { a[1] = -1; }) == 2027
        && errnoOf({: a[4] }) == 2015
        && errnoOf({: a[0] }) == 2015;
}
