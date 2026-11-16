#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   indexOf(val) returns the index of the first element equal to val,
 *   or nil.
 */
_main(args)
{
    local x = new StringBuffer();
    return [1, 2, 3, 3, 4, 5].indexOf(1) == 1
        && [1, 2, 3, 4, 5, 6].indexOf(7) == nil
        && [1, 2, 3, 4, 'a'].indexOf('a') == 5
        && [x, 1, 2, 3].indexOf(x) == 1
        && [1, [2], 3].indexOf([2]) == 2
        && [1, 2, 2].indexOf(2) == 2;
}
