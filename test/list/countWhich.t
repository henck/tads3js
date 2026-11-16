#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   countWhich(cond) counts the elements for which cond returns
 *   neither nil nor 0.
 */
_main(args)
{
    local x = [1, 2, 3, 3, 4, 5];
    return x.countWhich({e: e >= 3}) == 4
        && x.countWhich({e: e == 3 ? 1 : 0}) == 2
        && x.countWhich({e: nil}) == 0
        && [].countWhich({e: true}) == 0;
}
