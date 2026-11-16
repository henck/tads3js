#charset "utf-8"
#include <tads.h>

/*
 *   *, + and ? repeat the preceding item, matching as much as possible;
 *   intervals {n}, {n,m} and {n,} count repetitions.
 */
_main(args)
{
    return rexSearch('ab*c', 'xacx') == [2, 2, 'ac']
        && rexSearch('ab*c', 'abbbc') == [1, 5, 'abbbc']
        && rexSearch('ab+c', 'ac abc') == [4, 3, 'abc']
        && rexSearch('colou?r', 'color colour') == [1, 5, 'color']
        && rexSearch('colou?r', 'colour') == [1, 6, 'colour']
        && rexSearch('(the )+', 'the the end') == [1, 8, 'the the ']
        && rexSearch('a{3}', 'aaaa') == [1, 3, 'aaa']
        && rexSearch('a{2,3}', 'aaaa') == [1, 3, 'aaa']
        && rexSearch('a{2,}', 'aaaaa') == [1, 5, 'aaaaa']
        && rexSearch('a{2}', 'a') == nil
        && rexSearch('(ab){2}', 'ababab') == [1, 4, 'abab']
        && rexSearch('/%*.*%*/', 'a /* d */ = 1 /* v */;') == [3, 19, '/* d */ = 1 /* v */'];
}
