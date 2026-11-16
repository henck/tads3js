#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   car() returns the first element, or nil for an empty list.
 */
_main(args)
{
    return [1, 2, 3].car() == 1
        && [[1, 2], 3].car() == [1, 2]
        && [].car() == nil;
}
