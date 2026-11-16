#include <tads.h>
#include <vector.h>

/*
 *   A Vector equals a List or Vector with equal elements in the same
 *   order (compared as == does, recursively).
 */
_main(args)
{
    local v = new Vector([1, [2, 3], 'x']);
    return v == [1, [2, 3], 'x']
        && v == new Vector([1, [2, 3], 'x'])
        && v != [1, [2, 3]]
        && v != [1, [2, 4], 'x']
        && v != 1
        && new Vector() == [];
}
