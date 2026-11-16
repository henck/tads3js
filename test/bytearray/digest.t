#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   digestMD5() and sha256() hash the bytes (or a range) to upper-case
 *   hex digits.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray('xabcx');
    return new ByteArray('abc').digestMD5() == '900150983CD24FB0D6963F7D28E17F72'
        && a.digestMD5(2, 3) == '900150983CD24FB0D6963F7D28E17F72'
        && new ByteArray('abc').sha256() == 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'
        && a.sha256(2, 3) == 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD';
}
