#charset "utf-8"
#include <tads.h>

/*
 *   A ? after a closure or interval takes the shortest match.
 */
_main(args)
{
    return rexSearch('a+?', 'aaa') == [1, 1, 'a']
        && rexSearch('a*?b', 'aab') == [1, 3, 'aab']
        && rexSearch('a{2,4}?', 'aaaa') == [1, 2, 'aa']
        && rexSearch('xa??', 'xa') == [1, 1, 'x']
        && rexSearch('/%*.*?%*/', 'a /* d */ = 1 /* v */;') == [3, 7, '/* d */'];
}
