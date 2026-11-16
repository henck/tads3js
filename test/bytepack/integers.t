#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   c C s S l (and L, q, Q when packing) are 8/16/32/64-bit integers,
 *   little-endian unless > is used, two's complement for negatives. A
 *   count repeats; * uses all remaining arguments. Out-of-range values are
 *   "numeric overflow" (2023) unless % truncates them.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return P('C c', 255, -1) == [255, 255]
        && P('s s>', 1, 1) == [1, 0, 0, 1]
        && P('S', 65535) == [255, 255]
        && P('l', -2) == [254, 255, 255, 255]
        && P('l>', 258) == [0, 0, 1, 2]
        && P('L', 65536) == [0, 0, 1, 0]
        && P('q', 1) == [1, 0, 0, 0, 0, 0, 0, 0]
        && P('C3', 1, 2, 3) == [1, 2, 3]
        && P('C*', 4, 5) == [4, 5]
        && P('(s l)>', 1, 2) == [0, 1, 0, 0, 0, 2]
        && P('C%', 300) == [44]
        && P('s%', 0x12345678) == [0x78, 0x56]
        && errnoOf({: P('C', 300) }) == 2023
        && errnoOf({: P('c', 128) }) == 2023;
}
