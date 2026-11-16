#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   sublist(start, length?) returns a part of the list. Negative start
 *   counts from the end; negative length omits that many elements from
 *   the end.
 */
_main(args)
{
    return [1, 2, 3].sublist(2) == [2, 3]
        && [1, 2, 3].sublist(2, 1) == [2]
        && [1, 2, 3, 4, 5].sublist(1, -2) == [1, 2, 3]
        && [1, 2, 3, 4, 5].sublist(2, -2) == [2, 3]
        && [1, 2, 3, 4, 5].sublist(-2) == [4, 5]
        && [1, 2, 3, 4, 5].sublist(-3, 2) == [3, 4]
        && [1, 2, 3].sublist(2, 0) == []
        && [1, 2, 3].sublist(4) == []
        && [1, 2, 3].sublist(2, 10) == [2, 3];
}
