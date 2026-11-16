#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   & | ^ ~ on integers; << >> >>> use the shift count modulo 32; >> is
 *   arithmetic, >>> logical.
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local a = -7, one = 1;
    return (a & 3) == 1 && (a | 8) == -7 && (a ^ 5) == -4 && ~a == 6
        && (one << 31) == -2147483648
        && (one << 32) == 1
        && (one << -1) == -2147483648
        && (-8 >> 1) == -4
        && (-8 >>> 1) == 2147483644
        && (0x7f >> 4) == 7;
}
