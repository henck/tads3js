#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   lastValWhich(cond) returns the last element for which cond returns
 *   neither nil nor 0, or nil.
 */
_main(args)
{
    return [1, 5, 2, 5, 2, 5, 4, 5].lastValWhich({x: x <= 3}) == 2
        && [1, 2, 3].lastValWhich({x: x == 1 ? 1 : 0}) == 1
        && [1, 2, 3].lastValWhich({x: x > 9}) == nil;
}
