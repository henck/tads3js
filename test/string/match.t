#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   match(target, index?) returns the length of a match of a string or
 *   RexPattern exactly at index (default 1, negative counts from the
 *   end), or nil.
 */
_main(args)
{
    return 'abcdefghi'.match('def', 4) == 3
        && 'abcdef'.match('abc') == 3
        && 'abcdef'.match('bcd') == nil
        && 'abbbbcdefg'.match(R'ab+c') == 6
        && 'xxxabbbbcdefg'.match(R'ab+c', 4) == 6
        && 'xabbbbbcddd'.match(R'ab+c') == nil
        && 'abcdef'.match('ef', -2) == 2
        && 'abc'.match(R'x*') == 0
        && 'abc'.match('') == 0;
}
