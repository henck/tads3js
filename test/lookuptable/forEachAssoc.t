#include <tads.h>
#include <lookup.h>

/*
 *   forEachAssoc(func) calls func(key, value) for each entry. The table
 *   is not changed.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2, 'c' -> 3];
    local pairs = new Vector();
    t.forEachAssoc({k, v: pairs.append(k + v)});
    return pairs.toList().sort() == ['a1', 'b2', 'c3']
        && t['a'] == 1;
}
