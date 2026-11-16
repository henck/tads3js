#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   toString with a radix, toInteger (rounding half to even), toNumber
 *   (BigNumber for decimals and large values), and sprintf with BigNumber
 *   arguments. (Not tested: toInteger() of a value too large for an
 *   integer, for which the reference VM returns a wrong value instead of
 *   a "numeric overflow" error.)
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    local tn = toNumber('1.5');
    return toString(B('255'), 16) == 'FF'
        && toString(B('-255'), 16) == '-FF'
        && [toInteger(B('2.5')), toInteger(B('3.5')), toInteger(B('-2.7'))] == [2, 4, -3]
        && tn.ofKind(BigNumber) && VP(tn) == '1.5 p2'
        && toString(toNumber('99999999999')) == '99999999999'
        && toString(toNumber('1e3')) == '1000'
        && sprintf('%.2f|%d|%e|%g|%x', B('3.14159'), B('2.5'), B('12345.6'), B('0.0001234'), B('255'))
               == '3.14|2|1.234560e+004|0.0001234|ff'
        && toString(B('1e40')) == '10000000000000000000000000000000000000000';
}
