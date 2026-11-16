#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   split(delim?, limit?) splits at a string, a RexPattern, or into
 *   pieces of a given length (default 1); limit caps the number of
 *   pieces, the last holding the rest.
 */
_main(args)
{
    return 'one,two,three'.split(',') == ['one', 'two', 'three']
        && 'one,two, three, four'.split(R',<space>*') == ['one', 'two', 'three', 'four']
        && 'one,two,three'.split(',', 2) == ['one', 'two,three']
        && 'one,two,three'.split(',', 1) == ['one,two,three']
        && 'abcdefghi'.split(2) == ['ab', 'cd', 'ef', 'gh', 'i']
        && 'abc'.split() == ['a', 'b', 'c']
        && 'abc'.split(nil) == ['a', 'b', 'c']
        && 'a,,b'.split(',') == ['a', '', 'b']
        && 'abc'.split('x') == ['abc'];
}
