#include <tads.h>
#include <vector.h>

/*
 *   setLength(n) truncates, or pads with nil; returns self.
 */
_main(args)
{
    local u = new Vector([1, 2, 3, 4, 5]);
    local v = new Vector([1, 2, 3, 4, 5]);
    u.setLength(7);
    v.setLength(2).append('x');
    return u.toList() == [1, 2, 3, 4, 5, nil, nil]
        && v.toList() == [1, 2, 'x']
        && new Vector([1]).setLength(0).length() == 0;
}
