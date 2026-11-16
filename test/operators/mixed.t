#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   An integer combined with a BigNumber gives a BigNumber (an integer on
 *   the left converts with 10 digits of precision); with a string or nil
 *   it's "numeric value required" (2004); comparing an integer with a
 *   string is "invalid comparison" (2009), but == just gives nil.
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local one = 1, s = 'x', n = nil, b = new BigNumber('1.5');
    return VP(one + b) == '2.5 p10'
        && VP(3 - b) == '1.5 p10'
        && VP(3 * b) == '4.5 p10'
        && toString(3 / b) == '2'
        && toString(-5 / new BigNumber('2')) == '-2.5'
        && (3 < b) == nil && (3 > b) == true
        && 2 == new BigNumber('2.0')
        && errnoOf({: one + s }) == 2004
        && errnoOf({: one + n }) == 2004
        && errnoOf({: one - s }) == 2004
        && errnoOf({: one * s }) == 2004
        && errnoOf({: one < s }) == 2009
        && (one == s) == nil;
}
