#include <tads.h>
#include <dict.h>

/*
 *   findWord(str, vocabProp?) returns [obj, matchValue, ...] for each
 *   matching association. Without a comparator, strings match exactly
 *   (case-sensitively) and the match value is 1. Without vocabProp, an
 *   object is listed once per matching association (so 'card', a noun
 *   and an adjective of the same object, appears twice).
 */
property noun, adjective;
class Thing: object;

_main(args)
{
    local book = new Thing();
    local card = new Thing();
    local d = new Dictionary(nil);
    d.addWord(book, 'book', &noun);
    d.addWord(book, 'red', &adjective);
    d.addWord(card, 'card', &noun);
    d.addWord(card, 'card', &adjective);

    return d.findWord('book') == [book, 1]
        && d.findWord('BOOK') == []
        && d.findWord('boo') == []
        && d.findWord('card') == [card, 1, card, 1]
        && d.findWord('card', &noun) == [card, 1]
        && d.findWord('red', &noun) == []
        && d.findWord('red', &adjective) == [book, 1]
        && d.findWord('red', nil) == [book, 1];
}
