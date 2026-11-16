#include <tads.h>
#include <vector.h>

/*
 *   countWhich(cond) counts the elements for which cond returns
 *   neither nil nor 0.
 */
_main(args)
{
    local x = new Vector([1, 2, 3, 4, 5]);
    return x.countWhich({e: e >= 3}) == 3
        && x.countWhich({e: e > 3 ? 1 : 0}) == 2
        && x.countWhich({e: nil}) == 0;
}
