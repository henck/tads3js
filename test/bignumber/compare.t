#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   Comparisons and == compare values exactly (with integers too).
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return B('1.5') < B('2')
        && B('1.5') == B('1.50')
        && B('2') > 1
        && B('2') == 2
        && B('-1') <= B('-1.0')
        && !(B('1.5') == B('1.51'));
}
