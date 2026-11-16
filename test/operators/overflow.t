#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   Integer results that don't fit in 32 bits are promoted to BigNumber:
 *   with 10 digits of precision for + - negation ++ +=, and 20 for *.
 *   (Not tested: -2147483648 / -1 and % -1, which crash the reference
 *   VM.)
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local big = 2147483647, small = -2147483648, one = 1;
    local inc = big; inc++;
    local acc = big; acc += 1;
    return VP(big + one) == '2147483648 p10'
        && VP(small - one) == '-2147483649 p10'
        && VP(-small) == '2147483648 p10'
        && VP(big * big) == '4611686014132420609 p20'
        && VP(big * 2) == '4294967294 p20'
        && VP(inc) == '2147483648 p10'
        && VP(acc) == '2147483648 p10'
        && dataType(big + 0) == TypeInt;
}
