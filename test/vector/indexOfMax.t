#include <tads.h>
#include <vector.h>

/*
 *   indexOfMax(func?) returns the index of the largest element, or
 *   of the element for which func returns the largest value.
 */
_main(args)
{
    local x = new Vector(['hello', 'out', 'every1', 'there']);
    return x.indexOfMax({e: e.length()}) == 3
        && x.indexOfMax() == 4
        && new Vector([3, 9, 1]).indexOfMax() == 2;
}
