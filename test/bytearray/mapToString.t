#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   mapToString(charset?, start?, len?) converts bytes to a string,
 *   one character per byte, or decoded with a character set.
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
    local u = new ByteArray('é', 'utf-8');
    return a.mapToString() == 'abcd'
        && a.mapToString(nil, 2, 2) == 'bc'
        && a.mapToString(nil, 3) == 'cd'
        && u.mapToString('utf-8') == 'é'
        && u.mapToString() == 'Ã©'
        && toString(a) == 'abcd';
}
