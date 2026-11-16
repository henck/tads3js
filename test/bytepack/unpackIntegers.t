#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Unpacking integers: signed types sign-extend, > is big-endian, a
 *   count or * repeats, and ~ makes L/q/Q return integers when they fit.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return U([255], 'c') == [-1]
        && U([255], 'C') == [255]
        && U([1, 0, 0, 1], 's s>') == [1, 1]
        && U([254, 255, 255, 255], 'l') == [-2]
        && U([1, 2, 3], 'C3') == [1, 2, 3]
        && U([5, 6, 7], 'C*') == [5, 6, 7]
        && U([1, 0, 0, 0, 2, 0, 0, 0], 'l L~') == [1, 2]
        && U([7, 0, 0, 0, 0, 0, 0, 0], 'q~') == [7];
}
