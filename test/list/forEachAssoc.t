#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   forEachAssoc(func) calls func(index, value) for each element,
 *   first to last.
 */
_main(args)
{
    local s = '';
    ['a', 'b', 'c'].forEachAssoc(function(i, x) { s += toString(i) + '=' + x + ';'; });
    return s == '1=a;2=b;3=c;';
}
