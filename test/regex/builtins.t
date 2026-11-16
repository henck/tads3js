#charset "utf-8"
#include <tads.h>

/*
 *   rexMatch(pat, str, index?) returns the length of a match exactly at
 *   index, or nil; rexSearch(pat, str, index?) searches from index (but
 *   ^ still means the start of the string); rexSearchLast searches
 *   backwards for a match before index; patterns may be strings or
 *   RexPattern objects.
 */
_main(args)
{
    local p = new RexPattern('%d+');
    return rexMatch('%d+', '123abc') == 3
        && rexMatch('%d+', 'a123') == nil
        && rexMatch('%d+', 'a123', 2) == 3
        && rexMatch(p, '45x') == 2
        && rexMatch('x*', 'abc') == 0
        && rexSearch('%d+', 'a1b22', 3) == [4, 2, '22']
        && rexSearch('^a', 'aa', 2) == nil
        && rexSearch(p, 'ab7') == [3, 1, '7']
        && rexSearchLast('%d+', 'a12b345') == [5, 3, '345']
        && rexSearchLast('a', 'banana', 4) == [2, 1, 'a']
        && rexSearchLast('x', 'banana') == nil;
}
