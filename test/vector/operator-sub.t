#include <tads.h>
#include <vector.h>

/*
 *   vector - val returns a new vector without the elements equal to
 *   val (or to any element of val, if it's a List or Vector); the
 *   original is unchanged.
 */
_main(args)
{
    local v = new Vector([1, 2, 3, 4, 1]);
    local u = v - 1;
    local w = v - [1, 3];
    local x = v - new Vector([1, 3]);
    return u.toList() == [2, 3, 4]
        && w.toList() == [2, 4]
        && x.toList() == [2, 4]
        && v.toList() == [1, 2, 3, 4, 1];
}
