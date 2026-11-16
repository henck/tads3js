#include <tads.h>
#include <vector.h>

/*
 *   valWhich(cond) returns the first element for which cond returns
 *   neither nil nor 0, or nil.
 */
_main(args)
{
    local v = new Vector(['ab', 'bdd', 'cee', 'x']);
    return v.valWhich({e: e.length() == 3}) == 'bdd'
        && v.valWhich({e: e.length() == 1 ? 1 : 0}) == 'x'
        && v.valWhich({e: e.length() == 9}) == nil;
}
