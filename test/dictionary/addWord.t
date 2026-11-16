#include <tads.h>
#include <dict.h>
#include <vector.h>

/*
 *   addWord(obj, str, vocabProp) associates obj with the string, or with
 *   each string in a list or Vector. Adding an existing
 *   (string, object, property) association again is ignored.
 *
 *   (new Dictionary(nil) rather than new Dictionary(): the 3.1.3
 *   reference VM reads a comparator argument even when none is given.)
 */
property noun;
class Thing: object;

_main(args)
{
    local a = new Thing();
    local b = new Thing();
    local d = new Dictionary(nil);
    d.addWord(a, 'book', &noun);
    d.addWord(a, 'book', &noun);            // duplicate: ignored
    d.addWord(b, ['tome', 'volume'], &noun);
    d.addWord(b, new Vector(['folio']), &noun);
    d.addWord(b, 'book', &noun);

    local r = d.findWord('book');
    return r.length() == 4
        && r.indexOf(a) != nil && r.indexOf(b) != nil
        && d.findWord('tome') == [b, 1]
        && d.findWord('volume') == [b, 1]
        && d.findWord('folio') == [b, 1];
}
