#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   new ByteArray(size) is zero-filled; new ByteArray(string) stores one
 *   byte per character (above 255 is "numeric overflow"); with a
 *   character set the string is encoded; new ByteArray(array, start?,
 *   len?) copies (part of) another array.
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
    local c = new ByteArray(a);
    c[1] = 0;
    return L(new ByteArray(4)) == [0, 0, 0, 0]
        && L(a) == [97, 98, 99, 100]
        && L(new ByteArray('é', 'utf-8')) == [195, 169]
        && L(new ByteArray('é', 'latin-1')) == [233]
        && L(new ByteArray(a, 2)) == [98, 99, 100]
        && L(new ByteArray(a, 2, 2)) == [98, 99]
        && L(a) == [97, 98, 99, 100]
        && errnoOf({: new ByteArray('Ā') }) == 2023;
}
