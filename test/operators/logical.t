#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   && and || give true or nil, and need logical operands (true, nil or
 *   integers): converting another type for the result is error 2006, and
 *   testing one for short-circuiting is "logical value required" (2012).
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local o = 1, z = 0, n = nil, t = true, s = 'a', l = [];
    return (o && z) == nil
        && (o && n) == nil
        && (o && t) == true
        && (z || o) == true
        && (n || n) == nil
        && (o && 5) == true
        && errnoOf({: o && s }) == 2006
        && errnoOf({: o && l }) == 2006
        && errnoOf({: o && obj }) == 2006
        && errnoOf({: s || o }) == 2012;
}
