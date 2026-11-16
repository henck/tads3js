#include <tads.h>
#include <lookup.h>

/*
 *   forEach(func) calls func(value) for each entry. The table is not
 *   changed.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2, 'c' -> 3];
    local sum = 0;
    local n = 0;
    t.forEach(function(v) { sum += v; n++; });
    return sum == 6 && n == 3 && t['b'] == 2;
}
