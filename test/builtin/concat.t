#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   concat(...) concatenates the string forms of its arguments; nil
 *   counts as an empty string.
 */

_main(args)
{
    local n = nil;
    return concat() == ''
        && concat('a', 'b') == 'ab'
        && concat('a', 1, n, true, [1, 2]) == 'a1true1,2'
        && concat(new StringBuffer()) == '';
}
