#include <tads.h>
#include <lookup.h>

/*
 *   getEntryCount() returns the number of entries actually stored.
 */
_main(args)
{
    local t = new LookupTable(16, 100);
    local c0 = t.getEntryCount();
    t['a'] = 1;
    t['b'] = 2;
    t['a'] = 3;             // replacement doesn't add an entry
    local c2 = t.getEntryCount();
    t.removeElement('b');
    return c0 == 0 && c2 == 2 && t.getEntryCount() == 1;
}
