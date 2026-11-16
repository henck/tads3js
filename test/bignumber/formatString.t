#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   formatString(maxDigits?, flags?, wholePlaces?, fracDigits?,
 *   expDigits?, leadFiller?). Expected values are from the reference VM.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    local x = B('1234.5678'), s = B('0.25'), n = B('-12.5');
    return x.formatString() == '1234.5678'
        && x.formatString(6) == '1234.57'
        && x.formatString(3) == '1.23e3'
        && s.formatString(nil, BignumSign | BignumLeadingZero) == '+0.25'
        && n.formatString(nil, BignumSign) == '-12.5'
        && x.formatString(nil, BignumExp) == '1.2345678e3'
        && x.formatString(nil, BignumExp | BignumExpSign, nil, nil, 3) == '1.2345678e+003'
        && x.formatString(nil, BignumCommas) == '1,234.5678'
        && x.formatString(nil, BignumCommas | BignumEuroStyle) == '1.234,5678'
        && s.formatString(nil, 0, 4, 3) == '    .250'
        && x.formatString(nil, 0, 8, 2, nil, '*#') == '*#*#1234.57'
        && B('5').formatString(nil, BignumPoint) == '5.'
        && s.formatString(nil, BignumPosSpace) == ' .25'
        && B('0.000012').formatString(nil, BignumCompact) == '1.2e-5'
        && B('1.5e10').formatString(nil, BignumCompact) == '15000000000';
}
