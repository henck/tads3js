#include <tads.h>
#include <vector.h>

/*
 *   removeRange(start, end) removes elements start through end
 *   inclusive (negative counts from the end), and returns self.
 */
_main(args)
{
    local u = new Vector([1, 2, 3, 4, 5]);
    local v = new Vector([1, 2, 3, 4, 5]);
    local w = new Vector([1, 2, 3, 4, 5]);
    local z = new Vector([1, 2, 3, 4, 5]);
    return u.removeRange(2, 4).toList() == [1, 5]
        && v.removeRange(2, 2).toList() == [1, 3, 4, 5]
        && w.removeRange(-3, -2).toList() == [1, 2, 5]
        && z.removeRange(-2, -1).toList() == [1, 2, 3];
}
