#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   insertAt(index, val, ...) returns a new list with the values (a
 *   list stays one element) inserted before index; negative counts from
 *   the end, 0 and length+1 insert after the last element.
 */
_main(args)
{
    local x = [1, 2, 3];
    return x.insertAt(1, 'a', 'b') == ['a', 'b', 1, 2, 3]
        && x.insertAt(-2, 'x') == [1, 'x', 2, 3]
        && x.insertAt(-1, 'x') == [1, 2, 'x', 3]
        && x.insertAt(4, 'x') == [1, 2, 3, 'x']
        && x.insertAt(0, 'x') == [1, 2, 3, 'x']
        && x.insertAt(2, [9, 9]) == [1, [9, 9], 2, 3]
        && x.insertAt(3, 'a', 'b', 'c')[3] == 'a'
        && x == [1, 2, 3];
}
