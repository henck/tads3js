#include <tads.h>
#include <vector.h>

/*
 *   appendUnique(val) appends the elements of a list or Vector, and
 *   leaves only unique elements in the result (including removing
 *   duplicates already in the vector).
 */
_main(args)
{
    local u = new Vector([1, 2, 3, 4, 5]);
    u.appendUnique([3, 4, 5, 6, 7]);
    local w = new Vector([1, 1, 2]);
    w.appendUnique(new Vector([2, 3, 3]));
    return u.toList() == [1, 2, 3, 4, 5, 6, 7]
        && w.toList() == [1, 2, 3];
}
