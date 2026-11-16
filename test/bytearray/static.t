#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   A ByteArray created at compile time is stored in the image file.
 */

holder: object
    bytes = static new ByteArray('xy\u0000ÿ')
;

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local b = holder.bytes;
    return L(b) == [120, 121, 0, 255];
}
