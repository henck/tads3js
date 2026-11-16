#include <tads.h>
#include <vector.h>

/*
 *   minVal(func?) returns the smallest element, or the smallest
 *   value of func(element).
 *
 *   Note: the System Manual says minVal(func) returns the *element*
 *   that minimizes func, but the reference VM (3.1.3) returns the
 *   function's value. We follow the reference VM.
 */
_main(args)
{
    local v = new Vector(['ab', 'bdd', 'ceed', 'x']);
    return v.minVal() == 'ab'
        && v.minVal({e: e.length()}) == 1
        && new Vector([3, 9, 1]).minVal() == 1;
}
