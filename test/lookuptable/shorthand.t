#include <tads.h>
#include <lookup.h>

/*
 *   [k -> v, ...] creates a LookupTable; '* -> v' sets the default value.
 *   Each evaluation creates a new table.
 */
mk() { return ['a' -> 1, 'b' -> 2]; }

_main(args)
{
    local t = ['red' -> 1, 'green' -> 2, * -> 'undefined'];
    local t1 = mk();
    local t2 = mk();
    t1['a'] = 99;

    return t.getEntryCount() == 2
        && t['red'] == 1
        && t['blue'] == 'undefined'
        && t.getDefaultValue() == 'undefined'
        && t2['a'] == 1;
}
