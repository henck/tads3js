#include <tads.h>
#include <dict.h>

/*
 *   A comparator is any object with calcHash(str) and
 *   matchValues(inputStr, dictStr). It can be given to the constructor
 *   or set with setComparator(); nil restores exact matching. findWord
 *   returns matchValues' result as each object's match value, and
 *   isWordDefined uses the comparator too.
 */
property noun;
class Thing: object;

// Case-insensitive, and an input of 3+ characters may abbreviate a word.
caseless: object
    calcHash(s) { return s.toLower().substr(1, 3).length(); }
    matchValues(inp, dict)
    {
        inp = inp.toLower();
        dict = dict.toLower();
        if(inp == dict) return 'exact';
        if(inp.length() >= 3 && dict.startsWith(inp)) return 'trunc';
        return nil;
    }
;

_main(args)
{
    local book = new Thing();
    local d = new Dictionary(nil);
    d.addWord(book, ['book', 'tome'], &noun);

    d.setComparator(caseless);
    local r1 = d.findWord('BOOK') == [book, 'exact'];
    local r2 = d.findWord('boo') == [book, 'trunc'];
    local r3 = d.findWord('bo') == [];
    local r4 = d.isWordDefined('TOM') == true;

    d.setComparator(nil);
    local r5 = d.findWord('BOOK') == [];
    local r6 = d.findWord('book') == [book, 1];

    local d2 = new Dictionary(caseless);
    d2.addWord(book, 'Lamp', &noun);
    local r7 = d2.findWord('LAMP') == [book, 'exact'];

    return r1 && r2 && r3 && r4 && r5 && r6 && r7;
}
