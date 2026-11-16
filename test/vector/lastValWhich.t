#include <tads.h>
#include <vector.h>

/*
 *   lastValWhich(cond) returns the last element for which cond
 *   returns neither nil nor 0, or nil.
 */
_main(args)
{
    local v = new Vector(['ab', 'bdd', 'cee', 'x']);
    return v.lastValWhich({e: e.length() == 3}) == 'cee'
        && v.lastValWhich({e: e.length() == 9}) == nil;
}
