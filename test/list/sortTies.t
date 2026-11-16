#include <tads.h>
#include "../runtimeError.h"

/*
 *   sort() isn't stable: equal elements end up in the order the reference
 *   VM's quicksort (which partitions around the rightmost element) leaves
 *   them in. Descending order reverses the comparison, not the result.
 */
byFirst(a, b) { return a.substr(1, 1) == b.substr(1, 1) ? 0 : a.substr(1, 1) < b.substr(1, 1) ? -1 : 1; }

_main(args)
{
    local l = ['b0', 'a1', 'b2', 'a3', 'c4', 'a5', 'b6', 'c7', 'a8'];
    local v = new Vector(l);
    v.sort(nil, byFirst);
    return l.sort(nil, byFirst) == ['a3', 'a5', 'a8', 'a1', 'b6', 'b2', 'b0', 'c4', 'c7']
        && l.sort(true, byFirst) == ['c7', 'c4', 'b6', 'b0', 'b2', 'a8', 'a1', 'a5', 'a3']
        && v.toList() == ['a3', 'a5', 'a8', 'a1', 'b6', 'b2', 'b0', 'c4', 'c7']
        && ['b', 'a', 'c', 'a'].sort() == ['a', 'a', 'b', 'c'];
}
