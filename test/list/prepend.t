#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   prepend(val) returns a new list with val (a list stays one element)
 *   inserted before the first element.
 */
_main(args)
{
    local x = [1, 2, 3];
    return x.prepend(0) == [0, 1, 2, 3]
        && x.prepend([8, 9]) == [[8, 9], 1, 2, 3]
        && [].prepend(1) == [1]
        && x == [1, 2, 3];
}
