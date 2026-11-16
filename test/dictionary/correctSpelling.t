#include <tads.h>
#include <dict.h>

/*
 *   correctSpelling(str, maxEditDistance) returns [word, dist, repl] for
 *   each dictionary word within the edit distance, where a transposition
 *   of adjacent letters counts as one edit and repl is the number of
 *   replacements. A word that matches str exactly (distance 0) is not
 *   returned. The order is arbitrary, so results are sorted here.
 */
property noun;
class Thing: object;

byWord(lst) { return lst.sort(nil, {a, b: a[1].compareTo(b[1])}); }

_main(args)
{
    local d = new Dictionary(nil);
    d.addWord(new Thing(), ['book', 'books', 'boot', 'box', 'red', 'card', 'ab', 'ba'], &noun);

    return byWord(d.correctSpelling('bok', 1)) == [['book', 1, 0], ['box', 1, 1]]
        && d.correctSpelling('rde', 1) == [['red', 1, 0]]         // transposition
        && d.correctSpelling('cxrd', 2) == [['card', 1, 1]]       // replacement
        && byWord(d.correctSpelling('book', 1)) == [['books', 1, 0], ['boot', 1, 1]]
        && d.correctSpelling('ab', 1) == [['ba', 1, 0]]
        && d.correctSpelling('xyzzy', 1) == []
        && d.correctSpelling('red', 0) == [];
}
