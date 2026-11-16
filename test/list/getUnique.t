#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   getUnique() returns the unique elements, in order of first
 *   appearance.
 */
_main(args)
{
    return [1, 5, 2, 5, 3, 5, 4, 5].getUnique() == [1, 5, 2, 3, 4]
        && [[1], [1], 2].getUnique() == [[1], 2]
        && [].getUnique() == [];
}
