#charset "utf-8"
#include <tads.h>

/*
 *   %1 to %9 match the same text that group 1..9 matched.
 */
_main(args)
{
    return rexSearch('(%w)%1', 'abccd') == [3, 2, 'cc']
        && rexSearch('(a+)b%1', 'aaabaa') == [2, 5, 'aabaa']
        && rexSearch('(x)(y)%2%1', 'xyyx') == [1, 4, 'xyyx']
        && rexSearch('(%w)%1', 'abcd') == nil;
}
