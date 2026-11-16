#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   mapAll(func) returns a new list of func(element); the original is
 *   unchanged.
 */
_main(args)
{
    local x = [1, 2, 3, 4];
    local y = x.mapAll({e: e * 2});
    return y == [2, 4, 6, 8]
        && x == [1, 2, 3, 4]
        && [].mapAll({e: e}) == []
        && dataType(y) == TypeList;
}
