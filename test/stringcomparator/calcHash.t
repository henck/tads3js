#charset "utf-8"
#include <tads.h>
#include <strcomp.h>

/*
 *   calcHash(str) must give equal values for strings that match. The
 *   reference VM sums the (case-folded, mapped) characters, up to the
 *   truncation length, modulo 65536; the exact values are checked too.
 */
_main(args)
{
    local c = new StringComparator(6, nil,
        [['ß', 'ss', 0x100, 0x200], ['é', 'e', 0x400, 0x800]]);
    local s = new StringComparator(nil, true, nil);

    return c.calcHash('flashlight') == 634
        && c.calcHash('flashl') == 634
        && c.calcHash('FLASHLIGHT') == 634
        && c.calcHash('groß') == 558
        && c.calcHash('gross') == 558
        && c.calcHash('élan') == 416
        && c.calcHash('elan') == 416
        && s.calcHash('Book') == 395
        && s.calcHash('book') == 427
        && s.calcHash('') == 0;
}
