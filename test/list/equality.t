#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   Lists are equal when they have equal elements in the same order
 *   (compared recursively); a List can equal a Vector. (Locals are used
 *   because the compiler folds constant comparisons oddly.)
 */
_main(args)
{
    local a = [1, [2, 3], 'x'];
    local e = [], n = nil, one = 1, l1 = [1];
    return a == [1, [2, 1 + 2], 'x']
        && a != [1, [2, 3]]
        && a != [1, [2, 4], 'x']
        && a == new Vector([1, [2, 3], 'x'])
        && e == []
        && e != n
        && l1 != one;
}
