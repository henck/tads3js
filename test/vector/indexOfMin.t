#include <tads.h>
#include <vector.h>

/*
 *   indexOfMin(func?) returns the index of the smallest element, or
 *   of the element for which func returns the smallest value.
 */
_main(args)
{
    local x = new Vector(['hello', 'out', 'every1', 'there']);
    return x.indexOfMin({e: e.length()}) == 2
        && x.indexOfMin() == 3
        && new Vector([3, 9, 1]).indexOfMin() == 3;
}
