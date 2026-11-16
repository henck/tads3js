#include <tads.h>
#include "../runtimeError.h"

/*
 *   Documented error cases: out-of-range indices for [] (reading or
 *   assigning), insertAt, removeElementAt and removeRange are "index out
 *   of range" (2015).
 */
_main(args)
{
    local l = [1, 2, 3];
    return errnoOf({: l[4] }) == 2015
        && errnoOf({: l[0] }) == 2015
        && errnoOf(function() { local m = l; m[5] = 'x'; }) == 2015
        && errnoOf({: l.insertAt(5, 'x') }) == 2015
        && errnoOf({: l.removeElementAt(4) }) == 2015
        && errnoOf({: l.removeElementAt(0) }) == 2015
        && errnoOf({: l.removeRange(2, 4) }) == 2015
        && errnoOf({: l.removeRange(3, 2) }) == 2015
        && errnoOf({: l.insertAt(4, 'x') }) == nil;
}
