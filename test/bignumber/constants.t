#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   BigNumber constants (stored in the image file) get their precision
 *   from their significant digits; toString() shows plain notation without
 *   a leading zero or trailing zeros.
 */

B(s) { return new BigNumber(s); }
/* Value and precision, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    return VP(3.14159265) == '3.14159265 p9'
        && VP(0.00001) == '.00001 p1'
        && VP(0.00001000) == '.00001 p4'
        && VP(1.0e20) == '100000000000000000000 p2'
        && VP(123456789.0) == '123456789 p10'
        && VP(-0.5) == '-.5 p1'
        && VP(1.0e-10) == '.0000000001 p2';
}
