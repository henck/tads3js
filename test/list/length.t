#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   length() returns the number of elements.
 */
_main(args)
{
    return [1, 5, 2, 5, 3, 5, 4, 5].length() == 8
        && [].length() == 0
        && [[1, 2, 3]].length() == 1;
}
