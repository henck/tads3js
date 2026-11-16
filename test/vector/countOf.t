#include <tads.h>
#include <vector.h>

/*
 *   countOf(val) counts the elements equal to val.
 */
_main(args)
{
    local x = new Vector([1, 2, 2, 3, [1], [1]]);
    return x.countOf(2) == 2
        && x.countOf(9) == 0
        && x.countOf([1]) == 2;
}
