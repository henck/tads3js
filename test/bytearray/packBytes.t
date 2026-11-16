#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   arr.packBytes(index, format, ...) packs into the array and returns
 *   the byte count (too little room is "error writing file", 102);
 *   ByteArray.packBytes(format, ...) returns a new array;
 *   arr.unpackBytes(index, format) returns a list of values.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray(8);
    local idx = 1;
    idx += a.packBytes(idx, 'C2', 1, 2);
    idx += a.packBytes(idx, 's>', 258);
    local lst = a.unpackBytes(1, 'C2 s> @?');
    return idx == 5
        && L(a) == [1, 2, 1, 2, 0, 0, 0, 0]
        && L(ByteArray.packBytes('C3', 1, 2, 3)) == [1, 2, 3]
        && lst == [1, 2, 258, 4]
        && a.unpackBytes(3, 'C') == [1]
        && errnoOf({: new ByteArray(2).packBytes(1, 'l', 5) }) == 102;
}
