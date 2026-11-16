#include <tads.h>
#include <vector.h>

/*
 *   lastIndexWhich(cond) returns the index of the last element for
 *   which cond returns neither nil nor 0, or nil.
 */
_main(args)
{
    local x = new Vector([1, 2, 2, 3]);
    return x.lastIndexWhich({e: e == 2}) == 3
        && x.lastIndexWhich({e: e == 1 ? 1 : 0}) == 1
        && x.lastIndexWhich({e: e > 5}) == nil;
}
