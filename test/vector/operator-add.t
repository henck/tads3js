#include <tads.h>
#include <vector.h>

/*
 *   vector + val returns a new vector with val's elements appended
 *   (if it's a List or Vector) or val itself; the original is unchanged.
 */
_main(args)
{
    local u = new Vector([1, 2, 3]);
    local v = u + 4;
    local w = u + [4, 5];
    local y = u + new Vector([4, 5]);
    return v.toList() == [1, 2, 3, 4]
        && w.toList() == [1, 2, 3, 4, 5]
        && y.toList() == [1, 2, 3, 4, 5]
        && v.ofKind(Vector)
        && u.toList() == [1, 2, 3];
}
