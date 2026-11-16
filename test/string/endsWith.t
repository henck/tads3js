#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   endsWith(str) is true if the string ends with str.
 */
_main(args)
{
    local x = 'hello';
    return x.endsWith('llo') == true
        && x.endsWith('hello') == true
        && x.endsWith('') == true
        && x.endsWith('xhello') == nil
        && x.endsWith('LLO') == nil;
}
