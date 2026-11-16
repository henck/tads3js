#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   The byte packer's BigNumber types: d and f are IEEE doubles and
 *   floats (little-endian unless >), unpacking as BigNumbers with 17 and 8
 *   digits of precision; L, q and Q unpack as BigNumbers (10, 20 and 20
 *   digits), even for small values, unless ~ is used.
 */
P(fmt, [args]) { return String.packBytes(fmt, args...).toUnicode(); }
U(bytes, fmt) { return makeString(bytes).unpackBytes(fmt); }
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }

_main(args)
{
    local all = [255, 255, 255, 255, 255, 255, 255, 255];
    return P('d', new BigNumber('1.5')) == [0, 0, 0, 0, 0, 0, 248, 63]
        && P('f>', new BigNumber('1.5')) == [63, 192, 0, 0]
        && P('d', 2) == [0, 0, 0, 0, 0, 0, 0, 64]
        && toString(U(P('d', new BigNumber('1.5')), 'd')[1]) == '1.5'
        && VP(U(P('d', new BigNumber('0.1')), 'd')[1]) == '.10000000000000001 p17'
        && VP(U(P('f', new BigNumber('3.14159')), 'f')[1]) == '3.1415901 p8'
        && VP(U([255, 255, 255, 255], 'L')[1]) == '4294967295 p10'
        && U([1, 0, 0, 0], 'L')[1].ofKind(BigNumber)
        && VP(U(all, 'q')[1]) == '-1 p20'
        && toString(U(all, 'Q')[1]) == '18446744073709551615'
        && P('L', new BigNumber('4294967295')) == [255, 255, 255, 255]
        && P('Q', new BigNumber('18446744073709551615')) == all;
}
