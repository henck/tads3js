#include <tads.h>
#include <vector.h>

/*
 *   maxVal(func?) returns the largest element, or the largest value
 *   of func(element).
 *
 *   Note: the System Manual says maxVal(func) returns the *element*
 *   that maximizes func, but the reference VM (3.1.3) returns the
 *   function's value. We follow the reference VM.
 */
_main(args)
{
    local v = new Vector(['ab', 'bdd', 'ceed', 'x']);
    return v.maxVal() == 'x'
        && v.maxVal({e: e.length()}) == 4
        && new Vector([3, 9, 1]).maxVal() == 9;
}
