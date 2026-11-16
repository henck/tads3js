#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   indexWhich(cond) returns the index of the first element for which
 *   cond returns neither nil nor 0, or nil.
 */
_main(args)
{
    local x = [5, 10, 15, 20];
    return x.indexWhich({e: e > 10}) == 3
        && x.indexWhich({e: e == 20 ? 1 : 0}) == 4
        && x.indexWhich({e: e > 99}) == nil
        && [].indexWhich({e: true}) == nil;
}
