#charset "utf-8"
#include <tads.h>

/*
 *   | separates alternatives. Unlike many regex engines, TADS picks the
 *   alternative giving the longest overall match.
 */
_main(args)
{
    local r = rexSearch('x(a|ab)(c|bcd)', 'xabcd');
    local g1 = rexGroup(1), g2 = rexGroup(2);
    return rexSearch('cat|dog', 'hotdog') == [4, 3, 'dog']
        && rexSearch('a|ab', 'ab') == [1, 2, 'ab']
        && rexSearch('ab|a', 'ab') == [1, 2, 'ab']
        && rexSearch('the (red|blue) ball', 'the blue ball') == [1, 13, 'the blue ball']
        && r == [1, 5, 'xabcd']
        && g1[3] == 'a'
        && g2[3] == 'bcd';
}
