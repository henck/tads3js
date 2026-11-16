#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   valWhich(cond) returns the first element for which cond returns
 *   neither nil nor 0, or nil.
 */
_main(args)
{
    local x = [5, 10, 15, 20];
    return x.valWhich({e: e > 10}) == 15
        && x.valWhich({e: e == 20 ? 1 : 0}) == 20
        && x.valWhich({e: e > 99}) == nil;
}
