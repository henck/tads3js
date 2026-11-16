#include <tads.h>
#include <vector.h>

/*
 *   forEach(func) calls func(value) for each element, first to
 *   last.
 */
_main(args)
{
    local v = new Vector([1, 2, 3]);
    local s = '';
    v.forEach(function(x) { s += toString(x); });
    return s == '123';
}
