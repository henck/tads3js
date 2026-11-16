#include <tads.h>
#include <vector.h>

/*
 *   subset(func) returns a new Vector with the elements for which func
 *   returns a value other than nil or 0. The original is not modified.
 */
_main(args)
{
    local u = new Vector([1, 11, 3, 19, 5]);
    local w = u.subset({x: x > 10});
    local z = u.subset({x: x > 10 ? 1 : 0});
    return w.toList() == [11, 19]
        && z.toList() == [11, 19]
        && w.ofKind(Vector)
        && u.subset({x: nil}).length() == 0
        && u.toList() == [1, 11, 3, 19, 5];
}
