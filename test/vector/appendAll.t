#include <tads.h>
#include <vector.h>

/*
 *   appendAll(val) appends each element of a List or Vector
 *   individually, and returns self.
 *
 *   Not tested: appending a non-collection value. The manual says it
 *   works like append(), but the reference VM (3.1.3) misbehaves on it
 *   (it drops elements, and can crash the compiler during preinit).
 */
_main(args)
{
    local x = new Vector([1, 2, 3]);
    local metalist = [4, 5, 6].getUnique();
    local y = new Vector();
    local r = y.appendAll(x).appendAll(metalist).appendAll([7, 8, 9]);
    r.appendAll([[10]]);
    return y.toList() == [1, 2, 3, 4, 5, 6, 7, 8, 9, [10]]
        && x.toList() == [1, 2, 3];
}
