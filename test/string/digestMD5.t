#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   digestMD5() returns the MD5 digest as 32 (upper-case) hex digits.
 */
_main(args)
{
    return 'abc'.digestMD5() == '900150983CD24FB0D6963F7D28E17F72'
        && ''.digestMD5() == 'D41D8CD98F00B204E9800998ECF8427E';
}
