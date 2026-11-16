#include <tads.h>
#include <lookup.h>

/*
 *   valsToList() returns all values, in arbitrary order.
 */
_main(args)
{
    local t = ['b' -> 2, 'a' -> 1, 'c' -> 3];
    local e = new LookupTable();
    return t.valsToList().sort() == [1, 2, 3]
        && e.valsToList() == [];
}
