#include <tads.h>
#include <vector.h>

/*
 *   insertAt(index, val, ...) inserts the values (a list stays one
 *   element) before index; negative counts from the end, 0 and
 *   length+1 append; returns self.
 */
_main(args)
{
    local x = new Vector([1, 2, 3, 4, 5]);
    x.insertAt(2, 'i1', 'i2').insertAt(-2, 'v1', 'v2').insertAt(0, 'x');
    local y = new Vector([1, 2]);
    y.insertAt(1, [0]).insertAt(4, 'end');
    return x.toList() == [1, 'i1', 'i2', 2, 3, 'v1', 'v2', 4, 5, 'x']
        && y.toList() == [[0], 1, 2, 'end'];
}
