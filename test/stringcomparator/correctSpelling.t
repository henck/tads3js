#charset "utf-8"
#include <tads.h>
#include <strcomp.h>
#include <dict.h>

/*
 *   Dictionary.correctSpelling with a StringComparator: case folding,
 *   truncation and (single-character) equivalence mappings are not
 *   counted as edits. Words that match outright under the comparator
 *   have distance 0 and so are not returned.
 */
property noun;
class Thing: object;

byWord(lst) { return lst.sort(nil, {a, b: a[1].compareTo(b[1])}); }

_main(args)
{
    local d = new Dictionary(new StringComparator(6, nil, [['é', 'e', 0x400, 0x800]]));
    d.addWord(new Thing(), ['flashlight', 'élan', 'Book', 'box'], &noun);

    return d.correctSpelling('FLASHLIGHT', 1) == []      // case folding only
        && d.correctSpelling('flashl', 1) == []          // truncation only
        && d.correctSpelling('elan', 1) == []            // mapping only
        && d.correctSpelling('BOOK', 1) == []
        && d.correctSpelling('flashk', 1) == [['flashlight', 1, 1]]
        && d.correctSpelling('flashlihgt', 1) == [['flashlight', 1, 0]]
        && d.correctSpelling('Elna', 1) == [['élan', 1, 0]]
        && byWord(d.correctSpelling('bok', 1)) == [['Book', 1, 0], ['box', 1, 1]];
}
