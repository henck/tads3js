#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   Trigonometric, hyperbolic, exponential and logarithmic functions,
 *   at the value's precision. Out-of-range arguments are "value is out of
 *   range" (2027).
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    local one = B('1.000000000');
    return toString(BigNumber.getPi(10)) == '3.141592654'
        && toString(BigNumber.getE(10)) == '2.718281828'
        && toString(B('2.000000000').sqrt()) == '1.414213562'
        && toString(one.sine()) == '.8414709848'
        && toString(one.cosine()) == '.5403023059'
        && toString(one.tangent()) == '1.557407725'
        && toString(B('0.5000000000').arcsine()) == '.5235987756'
        && toString(B('0.5000000000').arccosine()) == '1.047197551'
        && toString(one.arctangent()) == '.7853981634'
        && toString(B('2.000000000').logE()) == '.6931471806'
        && toString(one.expE()) == '2.718281828'
        && toString(B('1000.000000').log10()) == '3'
        && toString(B('2.000000000').raiseToPower(B('0.5'))) == '1.414213562'
        && toString(B('2.00000').raiseToPower(10)) == '1024'
        && toString(one.sinh()) == '1.175201194'
        && toString(one.cosh()) == '1.543080635'
        && toString(one.tanh()) == '.761594156'
        && toString(B('180.0000000').degreesToRadians()) == '3.141592654'
        && toString(B('3.141592654').radiansToDegrees()) == '180'
        && errnoOf({: B('-1.0').sqrt() }) == 2027
        && errnoOf({: B('0.0').logE() }) == 2027;
}
