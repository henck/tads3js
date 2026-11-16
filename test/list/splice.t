#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   splice(start, deleteCount, ...) returns a new list with deleteCount
 *   elements at start replaced by the remaining arguments; negative
 *   start counts from the end, and 0 means after the last element.
 */
_main(args)
{
    local x = [1, 2, 3, 4, 5];
    return x.splice(0, 2, 'a') == [1, 2, 3, 4, 5, 'a']
        && x.splice(2, 2, 'x', 'y', 'z') == [1, 'x', 'y', 'z', 4, 5]
        && x.splice(2, 0, 'a') == [1, 'a', 2, 3, 4, 5]
        && x.splice(2, 3) == [1, 5]
        && x.splice(-2, 1, 'q') == [1, 2, 3, 'q', 5]
        && x.splice(1, 1, [7]) == [[7], 2, 3, 4, 5]
        && x == [1, 2, 3, 4, 5];
}
