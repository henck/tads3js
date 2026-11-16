#charset "utf-8"
#include <tads.h>

/*
 *   [...] matches one listed character or range; [^...] anything else.
 *   A leading - or ] is literal; other special characters are literal
 *   inside brackets.
 */
_main(args)
{
    return rexSearch('[aeiou]+', 'xyzoua') == [4, 3, 'oua']
        && rexSearch('[^aeiou]+', 'aaxyz') == [3, 3, 'xyz']
        && rexSearch('[a-cx-z]+', 'mmbxzq') == [3, 3, 'bxz']
        && rexSearch('[-#]+', 'a-#b') == [2, 2, '-#']
        && rexSearch('[]-^]+', 'a]^-b') == [2, 3, ']^-']
        && rexSearch('[.*%]+', 'a.*%b') == [2, 3, '.*%']
        && rexSearch('[&^]', 'x^') == [2, 1, '^']
        && rexSearch('[^]a]+', ']]bc]') == [3, 2, 'bc']
        && rexSearch('<nocase>[a-c]+', 'xABCx') == [2, 3, 'ABC']
        && rexSearch('a.c', 'abc') == [1, 3, 'abc'];
}
