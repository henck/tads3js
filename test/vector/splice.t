#include <tads.h>
#include <vector.h>

/*
 *   splice(idx, del, ...) deletes del elements at idx and inserts
 *   the remaining arguments there; negative idx counts from the end,
 *   0 means after the last element; returns self.
 */
_main(args)
{
    local u = new Vector([1, 2, 3, 4, 5]);
    u.splice(2, 2, 'x', 'y');
    local v = new Vector([1, 2, 3]);
    v.splice(-1, 1, 'z');
    local w = new Vector([1, 2, 3]);
    w.splice(0, 0, 'end');
    local x = new Vector([1, 2, 3]);
    x.splice(2, 0, 'a');
    local y = new Vector([1, 2, 3, 4]);
    y.splice(2, 2);
    return u.toList() == [1, 'x', 'y', 4, 5]
        && v.toList() == [1, 2, 'z']
        && w.toList() == [1, 2, 3, 'end']
        && x.toList() == [1, 'a', 2, 3]
        && y.toList() == [1, 4];
}
