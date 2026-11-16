#include <tads.h>
#include <vector.h>
#include "../runtimeError.h"

/*
 *   Documented error cases: reading past the end, and out-of-range
 *   indices for insertAt, removeElementAt and removeRange, are "index
 *   out of range" (2015).
 */
_main(args)
{
    local v = new Vector([1, 2, 3]);
    return errnoOf({: v[4] }) == 2015
        && errnoOf({: v[0] }) == 2015
        && errnoOf({: v.insertAt(5, 'x') }) == 2015
        && errnoOf({: v.removeElementAt(4) }) == 2015
        && errnoOf({: v.removeRange(2, 4) }) == 2015
        && errnoOf({: v.removeRange(3, 2) }) == 2015
        && errnoOf({: v.insertAt(4, 'x') }) == nil       // length + 1 is allowed
        && v.toList() == [1, 2, 3, 'x'];
}
