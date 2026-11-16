#include <tads.h>
#include <vector.h>

/*
 *   lastIndexOf(val) returns the index of the last element equal to
 *   val, or nil.
 */
_main(args)
{
    local x = new Vector([1, 2, 2, 2, 3]);
    return x.lastIndexOf(2) == 4
        && x.lastIndexOf(7) == nil
        && new Vector([[1], 2, [1]]).lastIndexOf([1]) == 3;
}
