#include <tads.h>
#include <vector.h>

/*
 *   copyFrom(source, sourceStart, destStart, count) copies up to
 *   count elements, stopping at the end of the source; negative indices
 *   count from the end; the vector grows as needed; returns self.
 */
_main(args)
{
    local x = new Vector([1, 2, 3, 4, 5, 6]);
    local res1 = x.copyFrom(['a', 'b', 'c', 'd'], 2, 4, 2).toList() == [1, 2, 3, 'b', 'c', 6];
    local y = new Vector(['x', 'y']);
    local res2 = y.copyFrom(x, 1, 2, 5).toList() == ['x', 1, 2, 3, 'b', 'c'];
    local z = new Vector([1, 2, 3, 4]);
    local res3 = z.copyFrom(['a', 'b', 'c'], -2, -1, 2).toList() == [1, 2, 3, 'b', 'c'];
    local w = new Vector([1, 2]);
    local res4 = w.copyFrom([7, 8], 1, 1, 10).toList() == [7, 8];
    return res1 && res2 && res3 && res4;
}
