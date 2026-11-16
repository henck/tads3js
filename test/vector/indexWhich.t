#include <tads.h>
#include <vector.h>

/*
 *   indexWhich(cond) returns the index of the first element for
 *   which cond returns neither nil nor 0, or nil.
 */
_main(args)
{
    local x = new Vector([1, 2, 2, 3]);
    return x.indexWhich({e: e == 2}) == 2
        && x.indexWhich({e: e == 3 ? 1 : 0}) == 4
        && x.indexWhich({e: e > 5}) == nil;
}
