#include <tads.h>
#include <dict.h>

/*
 *   removeWord(obj, str, vocabProp) removes only that exact association;
 *   str may be a list. Removing an association that doesn't exist is
 *   ignored.
 */
property noun, adjective;
class Thing: object;

_main(args)
{
    local a = new Thing();
    local b = new Thing();
    local d = new Dictionary(nil);
    d.addWord(a, ['book', 'tome'], &noun);
    d.addWord(a, 'book', &adjective);
    d.addWord(b, 'book', &noun);

    d.removeWord(a, ['tome', 'nothere'], &noun);
    d.removeWord(a, 'book', &noun);
    d.removeWord(b, 'book', &adjective);    // not defined: ignored

    return d.findWord('tome') == []
        && d.findWord('book', &noun) == [b, 1]
        && d.findWord('book', &adjective) == [a, 1];
}
