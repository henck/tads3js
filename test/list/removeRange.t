#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   removeRange(start, end) returns a new list without elements start
 *   through end inclusive; negative counts from the end.
 */
_main(args)
{
    local x = [1, 2, 3, 4, 5];
    return x.removeRange(2, 4) == [1, 5]
        && x.removeRange(2, 2) == [1, 3, 4, 5]
        && x.removeRange(-3, -2) == [1, 2, 5]
        && x.removeRange(-2, -1) == [1, 2, 3]
        && x.removeRange(1, 5) == []
        && x.removeRange(2, -2) == [1, 5]
        && x == [1, 2, 3, 4, 5];
}
