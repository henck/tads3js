#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   startsWith(str) is true if the string starts with str.
 */
_main(args)
{
    local x = 'hello';
    return x.startsWith('hel') == true
        && x.startsWith('hello') == true
        && x.startsWith('') == true
        && x.startsWith('hellox') == nil
        && x.startsWith('HEL') == nil;
}
