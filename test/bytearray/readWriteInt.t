#charset "utf-8"
#include <tads.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   readInt(start, format) and writeInt(start, format, val) convert
 *   8/16/32-bit integers; writeInt truncates without range checks.
 */

/* The bytes of a ByteArray, as a list. */
L(b) { local l = []; for(local i = 1; i <= b.length(); i++) l += b[i]; return l; }
/* Pack into a string, and return the byte values. */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
/* Unpack a list of byte values. */
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }

_main(args)
{
    local a = new ByteArray(4);
    local r = a.writeInt(1, FmtInt32BE, 258);
    local b = new ByteArray(2);
    b.writeInt(1, FmtUInt8, 1000);
    return r == nil
        && L(a) == [0, 0, 1, 2]
        && a.readInt(1, FmtInt32BE) == 258
        && a.readInt(3, FmtUInt16BE) == 258
        && a.readInt(3, FmtUInt16LE) == 513
        && L(b) == [232, 0]
        && b.readInt(1, FmtUInt8) == 232
        && b.readInt(1, FmtInt8) == -24
        && new ByteArray('ÿþ').readInt(1, FmtInt16LE) == -257;
}
