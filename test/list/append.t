#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   append(val) returns a new list with val added as a single element
 *   (even if val is a list).
 */
_main(args)
{
    local x = [1, 2, 3];
    return x.append(4) == [1, 2, 3, 4]
        && x.append([4, 5]) == [1, 2, 3, [4, 5]]
        && [].append(1) == [1]
        && x == [1, 2, 3];
}
