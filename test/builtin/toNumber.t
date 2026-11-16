#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   toNumber(val, radix?) converts like toInteger for whole numbers that
 *   fit in an integer. (BigNumber results are tested with BigNumber.)
 */

_main(args)
{
    local n = nil, t = true;
    return toNumber('42') == 42
        && dataType(toNumber('42')) == TypeInt
        && toNumber('ff', 16) == 255
        && toNumber('-7') == -7
        && toNumber(n) == 0 && toNumber(t) == 1
        && toNumber(9) == 9
        && errnoOf({: toNumber([1]) }) == 2019;
}
