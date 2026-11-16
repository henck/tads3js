#include <tads.h>
#include <vector.h>

/*
 *   forEachAssoc(func) calls func(index, value) for each element,
 *   first to last.
 */
_main(args)
{
    local v = new Vector(['a', 'b', 'c']);
    local s = '';
    v.forEachAssoc(function(i, x) { s += toString(i) + '=' + x + ';'; });
    return s == '1=a;2=b;3=c;';
}
