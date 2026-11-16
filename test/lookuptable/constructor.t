#include <tads.h>
#include <lookup.h>

/*
 *   new LookupTable(): empty table.
 *   new LookupTable(buckets, capacity): empty table (sizes are advisory).
 *   new LookupTable(list): key/value pairs; an odd last element is the
 *   default value. A Vector works as well as a list.
 */
_main(args)
{
    local a = new LookupTable();
    local b = new LookupTable(32, 64);
    local c = new LookupTable(['red', 1, 'green', 2]);
    local d = new LookupTable(['red', 1, 'green', 2, 'none']);
    local e = new LookupTable(new Vector(['x', 10, 'y', 20]));

    return a.getEntryCount() == 0
        && b.getEntryCount() == 0
        && c.getEntryCount() == 2 && c['red'] == 1 && c['green'] == 2
        && c['blue'] == nil
        && d.getEntryCount() == 2 && d['blue'] == 'none'
        && e['x'] == 10 && e['y'] == 20;
}
