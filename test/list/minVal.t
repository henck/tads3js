#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   minVal(func?) returns the smallest element, or the smallest value
 *   of func(element).
 *
 *   Note: the System Manual says minVal(func) returns the *element*
 *   that minimizes func, but the reference VM (3.1.3) returns the
 *   function's value. We follow the reference VM.
 */
_main(args)
{
    local x = ['hello', 'world', 'out', 'there', 'every1'];
    return x.minVal() == 'every1'
        && x.minVal({e: e.length()}) == 3
        && [3, 9, 1].minVal() == 1;
}
