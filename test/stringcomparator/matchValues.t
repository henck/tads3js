#charset "utf-8"
#include <tads.h>
#include <strcomp.h>

/*
 *   matchValues(input, ref) returns 0 for no match, or StrCompMatch
 *   combined with StrCompCaseFold (case differed), StrCompTrunc (input
 *   abbreviates ref, and is at least the truncation length) and the
 *   upper/lower-case flags of any equivalence mappings used. Case
 *   folding is tried before mappings, and is full folding, so 'gross'
 *   matches 'groß' by case folding.
 *
 *   'grosx' matching 'groß' is a quirk of the reference VM: a mapping
 *   compares each of its characters with the *first* input character.
 */
_main(args)
{
    local c = new StringComparator(6, nil,
        [['ß', 'ss', 0x100, 0x200], ['é', 'e', 0x400, 0x800]]);
    local s = new StringComparator(nil, true, nil);

    return c.matchValues('flashl', 'flashlight') == (StrCompMatch | StrCompTrunc)
        && c.matchValues('flash', 'flashlight') == 0             // too short
        && c.matchValues('flashlights', 'flashlight') == 0       // too long
        && c.matchValues('FlashLight', 'flashlight') == (StrCompMatch | StrCompCaseFold)
        && c.matchValues('gross', 'groß') == (StrCompMatch | StrCompCaseFold)
        && c.matchValues('GROSS', 'groß') == (StrCompMatch | StrCompCaseFold)
        && c.matchValues('Elan', 'élan') == (StrCompMatch | StrCompCaseFold | 0x400)
        && c.matchValues('elan', 'élan') == (StrCompMatch | 0x800)
        && c.matchValues('élan', 'élan') == StrCompMatch
        && c.matchValues('gro', 'groß') == 0
        && c.matchValues('grosx', 'groß') == (StrCompMatch | 0x200)   // quirk
        && c.matchValues('grosxx', 'groß') == 0
        && s.matchValues('book', 'book') == StrCompMatch
        && s.matchValues('Book', 'book') == 0
        && s.matchValues('boo', 'book') == 0;
}
