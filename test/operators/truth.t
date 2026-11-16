#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   In conditions (if, while, ?:) only nil and 0 are false; ! works on any
 *   value. == between different types is nil (nil isn't 0, true isn't 1).
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local z = 0, o = 1, n = nil, t = true, e = '', l = [], s = 'a', p = &foo;
    local w = 0;
    while(z) { w++; break; }
    return [!z, !o, !n, !t, !e, !l, !s, !obj, !p] == [true, nil, true, nil, nil, nil, nil, nil, nil]
        && [z ? 1 : 2, e ? 1 : 2, l ? 1 : 2, n ? 1 : 2, s ? 1 : 2] == [2, 1, 1, 2, 1]
        && w == 0
        && [n == z, n == nil, t == 1, e == nil, l == nil, obj == obj] == [nil, true, nil, nil, nil, true];
}
