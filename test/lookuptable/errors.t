#include <tads.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   nthKey(n) and nthVal(n) with n out of range are "index out of range"
 *   (2015). (Except that, contrary to the manual, the reference VM
 *   doesn't treat an index of 0 as an error, so that isn't tested.)
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2];
    return errnoOf({: t.nthKey(3) }) == 2015
        && errnoOf({: t.nthVal(3) }) == 2015
        && errnoOf({: t.nthKey(2) }) == nil;
}
