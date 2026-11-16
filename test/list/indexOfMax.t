#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   indexOfMax(func?) returns the index of the largest element, or of
 *   the element for which func returns the largest value.
 */
_main(args)
{
    return ['hello', 'out', 'every1', 'there'].indexOfMax({x: x.length()}) == 3
        && [1, 2, 3, 6, 2, 1].indexOfMax() == 4
        && ['b', 'c', 'a'].indexOfMax() == 2;
}
