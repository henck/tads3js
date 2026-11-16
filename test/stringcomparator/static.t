#charset "utf-8"
#include <tads.h>
#include <strcomp.h>

/*
 *   A StringComparator created at compile time is stored in the image
 *   file (truncation length, case sensitivity and mappings) and must be
 *   loaded intact.
 */
holder: object
    comp = static new StringComparator(4, nil, [['é', 'e', 0x400, 0x800]])
    exact = static new StringComparator(nil, true, nil)
;

_main(args)
{
    local c = holder.comp;
    local x = holder.exact;
    return c.matchValues('Elan', 'élan') == (StrCompMatch | StrCompCaseFold | 0x400)
        && c.matchValues('elan', 'élan') == (StrCompMatch | 0x800)
        && c.matchValues('LANT', 'lantern') == (StrCompMatch | StrCompCaseFold | StrCompTrunc)
        && c.matchValues('lan', 'lantern') == 0
        && c.calcHash('élan') == c.calcHash('ELAN')
        && x.matchValues('Lamp', 'lamp') == 0
        && x.matchValues('lamp', 'lamp') == StrCompMatch;
}
