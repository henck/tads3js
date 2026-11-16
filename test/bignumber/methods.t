#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   getScale, getWhole, getFraction, roundToDecimal, setPrecision,
 *   getCeil, getFloor, scaleTen, copySignFrom, isNegative, getAbs, negate.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return [B('123.45').getScale(), B('0.0012').getScale(), B('0').getScale(), B('0.5').getScale()] == [3, -2, 1, 0]
        && toString(B('1.99999').getWhole()) == '1'
        && toString(B('-2.75').getFraction()) == '-.75'
        && toString(B('-2.75').getWhole()) == '-2'
        && toString(B('1.2345').roundToDecimal(2)) == '1.23'
        && toString(B('1234.5').roundToDecimal(-2)) == '1200'
        && toString(B('2.5').roundToDecimal(0)) == '2'
        && VP(B('3.14159').setPrecision(3)) == '3.14 p3'
        && VP(B('2').setPrecision(4)) == '2 p4'
        && [toString(B('2.2').getCeil()), toString(B('-1.6').getCeil()), toString(B('-1.6').getFloor())] == ['3', '-1', '-2']
        && toString(B('1.5').scaleTen(3)) == '1500'
        && toString(B('1.5').copySignFrom(B('-2'))) == '-1.5'
        && B('-0.1').isNegative() == true && B('0.1').isNegative() == nil
        && toString(B('-1.5').getAbs()) == '1.5'
        && toString(B('1.5').negate()) == '-1.5';
}
