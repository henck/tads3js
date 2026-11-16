#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   new BigNumber(int, prec?) defaults to 32 digits; new BigNumber(string,
 *   prec?) to the string's significant digits.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return VP(new BigNumber(100)) == '100 p32'
        && VP(new BigNumber(100, 10)) == '100 p10'
        && VP(B('3.14159265')) == '3.14159265 p9'
        && VP(B('1.06e-30')) == '.00000000000000000000000000000106 p3'
        && VP(new BigNumber('1.06e-30', 8)) == '.00000000000000000000000000000106 p8'
        && B('0012').getPrecision() == 2
        && B('1.2000').getPrecision() == 5
        && B('000.00012').getPrecision() == 2
        && B('3.20e06').getPrecision() == 3
        && VP(new BigNumber(B('2.5'), 4)) == '2.5 p4';
}
