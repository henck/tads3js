#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   appendUnique(lst) returns the unique elements of this list plus
 *   lst (duplicates already in this list are removed too).
 */
_main(args)
{
    return [1, 2, 3, 3, 4, 5].appendUnique([4]) == [1, 2, 3, 4, 5]
        && [1, 2].appendUnique([2, 3, 3]) == [1, 2, 3]
        && [].appendUnique([1, 1]) == [1]
        && [1, 1].appendUnique([]) == [1];
}
