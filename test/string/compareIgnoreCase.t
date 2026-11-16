#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   compareIgnoreCase(str) compares the case-folded strings.
 */
_main(args)
{
    local x = 'hello world';
    return x.compareIgnoreCase('HELLo WORLD') == 0
        && 'hEllo'.compareIgnoreCase(x) < 0
        && 'B'.compareIgnoreCase('a') > 0
        && 'WEISS'.compareIgnoreCase('weiß') == 0;
}
