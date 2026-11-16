#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   mapToByteArray() with no character set makes a ByteArray with one
 *   byte per character (its code point).
 */
_main(args)
{
    local b = 'ABé'.mapToByteArray();
    return b.length() == 3
        && b[1] == 65
        && b[2] == 66
        && b[3] == 0xe9;
}
