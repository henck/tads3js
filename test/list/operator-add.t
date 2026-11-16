#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   list + val appends the elements of a list (or Vector) val, or val
 *   itself; the original is unchanged.
 */
_main(args)
{
    local x = [1, 2, 3];
    return x + 4 == [1, 2, 3, 4]
        && x + [4, 5] == [1, 2, 3, 4, 5]
        && x + [[4, 5]] == [1, 2, 3, [4, 5]]
        && x + new Vector([4]) == [1, 2, 3, 4]
        && x + [] == [1, 2, 3]
        && x == [1, 2, 3];
}
