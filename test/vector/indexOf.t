#include <tads.h>
#include <vector.h>

/*
 *   indexOf(val) returns the index of the first element equal to
 *   val, or nil.
 */
_main(args)
{
    local x = new Vector([1, 2, 2, 2, 3, [1, 2]]);
    return x.indexOf(2) == 2
        && x.indexOf(7) == nil
        && x.indexOf([1, 2]) == 6;
}
