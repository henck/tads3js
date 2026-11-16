#include <tads.h>
#include <lookup.h>

/*
 *   A table created at compile time is stored in the image file and must
 *   be loaded with its entries and default value intact.
 */
holder: object
    tab = static ['a' -> 1, 'b' -> 2, * -> 'dflt']
;

_main(args)
{
    local t = holder.tab;
    return t.getEntryCount() == 2
        && t['a'] == 1
        && t['b'] == 2
        && t['zzz'] == 'dflt';
}
