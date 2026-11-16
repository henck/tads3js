#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   indexOfMin(func?) returns the index of the smallest element, or of
 *   the element for which func returns the smallest value.
 */
_main(args)
{
    return ['hello', 'out', 'every1', 'there'].indexOfMin({x: x.length()}) == 2
        && [3, 2, 3, 6, 1, 9].indexOfMin() == 5
        && ['b', 'c', 'a'].indexOfMin() == 3;
}
