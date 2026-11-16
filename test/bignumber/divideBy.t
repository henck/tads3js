#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   divideBy(x) returns [quotient, remainder]; equalRound compares at the
 *   lower precision.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    local r = B('10.0000').divideBy(B('3.00000'));
    return toString(r[1]) == '3' && toString(r[2]) == '1'
        && B('1.23').equalRound(B('1.2')) == true
        && B('1.26').equalRound(B('1.2')) == nil
        && errnoOf({: B('1').divideBy(B('0')) }) == 2008;
}
