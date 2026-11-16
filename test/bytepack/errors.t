#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Unpacking past the end is "error reading file" (101); a bad format
 *   string is a parsing error (107).
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    return errnoOf({: U([1], 'S') }) == 101
        && errnoOf({: P('Z', 1) }) == 107
        && errnoOf({: P('(C', 1) }) == 107;
}
