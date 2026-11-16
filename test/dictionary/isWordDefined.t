#include <tads.h>
#include <dict.h>

/*
 *   isWordDefined(str) returns true if the string matches any word in
 *   the dictionary (using the comparator, if any), nil otherwise.
 */
property noun;
class Thing: object;

_main(args)
{
    local d = new Dictionary(nil);
    d.addWord(new Thing(), 'book', &noun);
    local a = d.isWordDefined('book');
    local b = d.isWordDefined('BOOK');
    local c = d.isWordDefined('xyzzy');
    return a == true && b == nil && c == nil;
}
