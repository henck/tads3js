#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   compareTo(str) returns <0, 0 or >0, comparing by Unicode code
 *   point.
 */
_main(args)
{
    local x = 'hello, world';
    return x.compareTo('hello, world') == 0
        && 'hello'.compareTo(x) < 0
        && x.compareTo('hello') > 0
        && 'B'.compareTo('a') < 0
        && 'b'.compareTo('a') > 0
        && ''.compareTo('') == 0;
}
