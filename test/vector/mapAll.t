#include <tads.h>
#include <vector.h>

/*
 *   mapAll(func) returns a new vector of func(element); the
 *   original is unchanged.
 */
_main(args)
{
    local u = new Vector([1, 2, 3, 4, 5]);
    local v = u.mapAll({e: e * 2});
    return v.toList() == [2, 4, 6, 8, 10]
        && v.ofKind(Vector)
        && u.toList() == [1, 2, 3, 4, 5];
}
