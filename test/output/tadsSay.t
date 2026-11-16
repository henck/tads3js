#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   tadsSay(val, ...) displays strings, numbers, lists and string-like
 *   objects; nil displays nothing; true or a property pointer is
 *   "invalid type for intrinsic function argument" (2304).
 */

_main(args)
{
    local sb = new StringBuffer();
    sb.append('buffer');
    tadsSay('a', 1, ' ', -5, ' ', new BigNumber('1.50'), ' ', sb, ' ', ['x', 2], nil, '\n');
    return errnoOf({: tadsSay(true) }) == 2304
        && errnoOf({: tadsSay(&foo) }) == 2304;
}
