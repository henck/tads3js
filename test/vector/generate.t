#include <tads.h>
#include <vector.h>

/*
 *   Vector.generate(func, n) makes a vector of n elements from
 *   func(index), or from func() for a zero-argument function.
 */
_main(args)
{
    local n = 0;
    local e = Vector.generate({i: i * 2}, 5);
    local f = Vector.generate({: ++n}, 3);
    local g = Vector.generate({i: i}, 0);
    return e.toList() == [2, 4, 6, 8, 10]
        && f.toList() == [1, 2, 3]
        && g.length() == 0
        && e.ofKind(Vector);
}
