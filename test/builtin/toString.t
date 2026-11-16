#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   toString(val, radix?, isSigned?): integers in any base (unsigned
 *   by default for bases other than 10), true/nil, lists, StringBuffers
 *   and RexPatterns.
 */

_main(args)
{
    local n = nil, t = true;
    local b = new StringBuffer(); b.append('buf');
    return toString(255) == '255'
        && toString(-5) == '-5'
        && toString(255, 16) == 'FF'
        && toString(255, 2) == '11111111'
        && toString(-1, 16) == 'FFFFFFFF'
        && toString(-1, 16, true) == '-1'
        && toString(35, 36) == 'Z'
        && toString(-1, 10, nil) == '4294967295'
        && toString(t) == 'true'
        && toString(n) == 'nil'
        && toString('abc') == 'abc'
        && toString([1, 'a', [2, 3]]) == '1,a,2,3'
        && toString(b) == 'buf'
        && toString(new RexPattern('a+b')) == 'a+b';
}
