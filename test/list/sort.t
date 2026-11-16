#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   sort(descending?, comparisonFunction?) returns a new sorted list.
 *   The sort is not stable: the reference VM may reorder elements that
 *   compare equal, so the comparison-function cases use values that
 *   never tie.
 */
_main(args)
{
    local x = ['hello', 'world', 'out', 'there', 'every1'];
    local y = ['hello', 'out', 'every1', 'ab'];
    local byLen = {a, b: a.length() - b.length()};
    return x.sort()     == ['every1', 'hello', 'out', 'there', 'world']
        && x.sort(nil)  == ['every1', 'hello', 'out', 'there', 'world']
        && x.sort(true) == ['world', 'there', 'out', 'hello', 'every1']
        && y.sort(nil, byLen)  == ['ab', 'out', 'hello', 'every1']
        && y.sort(true, byLen) == ['every1', 'hello', 'out', 'ab']
        && [3, -1, 10, 2].sort() == [-1, 2, 3, 10]
        && [].sort() == []
        && x == ['hello', 'world', 'out', 'there', 'every1'];   // original unchanged
}
