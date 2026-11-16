#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   numType() returns NumTypeXxx flags.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return B('1').numType() == NumTypeNum
        && B('0').numType() == (NumTypeNum | NumTypePZero);
}
