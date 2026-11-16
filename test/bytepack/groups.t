#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   ( ) groups items; [ ] groups items taken from (or unpacked into) a
 *   list, with ! making one list per iteration; a count repeats a group.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('(C C)2', 1, 2, 3, 4) == [1, 2, 3, 4]
        && P('C [C]2 C', 1, [2, 3], 4) == [1, 2, 3, 4]
        && P('[C C]2!', [1, 2], [3, 4]) == [1, 2, 3, 4]
        && U([1, 2, 3], '[C]2 C') == [[1, 2], 3]
        && U([1, 2, 3, 4], '[C C]2!') == [[1, 2], [3, 4]]
        && U([1, 2, 3, 4], '(C C)2') == [1, 2, 3, 4];
}
