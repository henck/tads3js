#charset "utf-8"
#include <tads.h>

/*
 *   ^ and $ match at the start and end of the string; %< and %> at the
 *   start and end of a word, %b at either, %B elsewhere. Word characters
 *   are alphanumeric (not underscore).
 */
_main(args)
{
    return rexSearch('^abc', 'xabc') == nil
        && rexSearch('^abc', 'abcabc') == [1, 3, 'abc']
        && rexSearch('abc$', 'abcxabc') == [5, 3, 'abc']
        && rexSearch('^$', '') == [1, 0, '']
        && rexSearch('%<cat%>', 'concat cat') == [8, 3, 'cat']
        && rexSearch('%bx', 'ax x') == [4, 1, 'x']
        && rexSearch('%Bx', 'x ax') == [4, 1, 'x']
        && rexSearch('%<b', 'a_b') == [3, 1, 'b']
        && rexSearch('a%>', 'ab a') == [4, 1, 'a'];
}
