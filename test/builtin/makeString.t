#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   makeString(val, repeatCount?) repeats a string, a list of character
 *   codes, or a single character code.
 */

_main(args)
{
    return makeString('abc', 3) == 'abcabcabc'
        && makeString([65, 66, 67]) == 'ABC'
        && makeString([65, 66], 2) == 'ABAB'
        && makeString(65, 5) == 'AAAAA'
        && makeString('x', 0) == ''
        && errnoOf({: makeString('x', -1) }) != nil;
}
