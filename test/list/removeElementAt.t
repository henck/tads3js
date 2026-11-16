#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   removeElementAt(index) returns a new list without that element;
 *   negative counts from the end.
 */
_main(args)
{
    local x = [1, 2, 3];
    return x.removeElementAt(2) == [1, 3]
        && x.removeElementAt(-2) == [1, 3]
        && x.removeElementAt(1) == [2, 3]
        && x.removeElementAt(-1) == [1, 2]
        && [9].removeElementAt(1) == []
        && x == [1, 2, 3];
}
