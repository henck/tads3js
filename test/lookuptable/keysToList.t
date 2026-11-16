#include <tads.h>
#include <lookup.h>

/*
 *   keysToList() returns all keys, in arbitrary order.
 */
_main(args)
{
    local t = ['b' -> 2, 'a' -> 1, 'c' -> 3];
    local e = new LookupTable();
    return t.keysToList().sort() == ['a', 'b', 'c']
        && e.keysToList() == [];
}
