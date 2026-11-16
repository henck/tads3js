#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   lastIndexWhich(cond) returns the index of the last element for
 *   which cond returns neither nil nor 0, or nil.
 */
_main(args)
{
    return [5, 10, 15, 20, 8].lastIndexWhich({x: x > 10}) == 4
        && [1, 2, 3, 3, 3, 3, 4, 5].lastIndexWhich({x: x == 3}) == 6
        && [1, 2, 3].lastIndexWhich({x: x == 1 ? 1 : 0}) == 1
        && [1, 2, 3].lastIndexWhich({x: x > 9}) == nil;
}
