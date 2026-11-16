#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   length() returns the number of characters (not bytes).
 */
_main(args)
{
    return 'abc'.length() == 3
        && ''.length() == 0
        && 'ßé'.length() == 2;
}
