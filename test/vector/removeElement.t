#include <tads.h>
#include <vector.h>

/*
 *   removeElement(val) removes every element equal to val (or
 *   nothing, if none is), and returns self.
 */
_main(args)
{
    local v = new Vector([1, 2, 3, 4, 3, 5, 3]);
    v.removeElement(3).removeElement(9);
    local w = new Vector([1, [2], 3]);
    w.removeElement([2]);
    return v.toList() == [1, 2, 4, 5]
        && w.toList() == [1, 3];
}
