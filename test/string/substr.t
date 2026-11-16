#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   substr(start, length?): negative start counts from the end;
 *   negative length drops characters from the end.
 */
_main(args)
{
    return 'abcdef'.substr(3) == 'cdef'
        && 'abcdef'.substr(3, 2) == 'cd'
        && 'abcdefghi'.substr(-3) == 'ghi'
        && 'abcdefghi'.substr(-3, 2) == 'gh'
        && 'abcdefghi'.substr(1, -1) == 'abcdefgh'
        && 'abcdefghi'.substr(2, -2) == 'bcdefg'
        && 'abcdefghi'.substr(4, -2) == 'defg'
        && 'abcdefghi'.substr(4, -4) == 'de'
        && 'abcdefghi'.substr(-4, -2) == 'fg'
        && 'abc'.substr(1, 0) == ''
        && 'abc'.substr(2, 10) == 'bc'
        && 'abc'.substr(5) == '';
}
