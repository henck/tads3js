#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   countOf(val) counts the elements equal to val.
 */
_main(args)
{
    return [1, 2, 3, 3, 4, 5].countOf(3) == 2
        && [1, 2].countOf(9) == 0
        && [[1], [1], 1].countOf([1]) == 2;
}
