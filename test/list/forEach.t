#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   forEach(func) calls func(value) for each element, first to last.
 */
_main(args)
{
    local s = '';
    [1, 2, 3].forEach(function(x) { s += toString(x); });
    return s == '123';
}
