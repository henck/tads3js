#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   list - val removes every element equal to val, or to any element
 *   of a list val; the original is unchanged.
 */
_main(args)
{
    local x = [1, 2, 3, 2, 1];
    return x - 2 == [1, 3, 1]
        && x - [1, 3] == [2, 2]
        && x - 9 == [1, 2, 3, 2, 1]
        && [[1], 2] - [[1]] == [2]
        && x == [1, 2, 3, 2, 1];
}
