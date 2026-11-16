#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Unpacking strings: a strips trailing nulls, A trailing spaces; a0
 *   reads to (and skips) a null terminator; b gives a ByteArray.
 *   (Not tested: unpacking big-endian wide strings ('w>'), which the
 *   reference VM 3.1.3 decodes incorrectly.)
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local b = U([120, 121], 'b2')[1];
    return U([104, 0, 0], 'a3') == ['h']
        && U([104, 105, 32, 32], 'A4') == ['hi']
        && U([104, 105, 0, 120], 'a0 C') == ['hi', 120]
        && U([195, 169], 'u2') == ['é']
        && U([97, 0, 98, 0], 'w2') == ['ab']
        && U([65, 66], 'H4') == ['4142']
        && U([65], 'h2') == ['14']
        && U([104, 105], 'a*') == ['hi']
        && b.ofKind(ByteArray) && L(b) == [120, 121];
}
