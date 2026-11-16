#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   + - * / give the larger operand precision (an integer counts as 32
 *   digits), rounding half to even.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return VP(B('1.7') * B('0.25')) == '.42 p2'
        && VP(B('1.9') * B('0.25')) == '.48 p2'
        && VP(B('1.9') * B('0.33')) == '.63 p2'
        && VP(B('3.1415') + B('0.000111')) == '3.1416 p5'
        && VP(B('7.25e3') + B('122')) == '7370 p3'
        && VP(B('7.25e3') + B('127')) == '7380 p3'
        && VP(B('10.0') / B('3.0')) == '3.33 p3'
        && VP(new BigNumber(1, 10) / 3) == '.33333333333333333333333333333333 p32'
        && VP(B('2.5') * 4) == '10 p32'
        && VP(B('5.25') - B('1.5')) == '3.75 p3'
        && VP(-B('1.5')) == '-1.5 p2'
        && errnoOf({: B('1.0') / B('0.0') }) == 2008;
}
