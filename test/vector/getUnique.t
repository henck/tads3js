#include <tads.h>
#include <vector.h>

/*
 *   getUnique() returns a new vector of the unique elements, in
 *   order of first appearance. The original is unchanged.
 */
_main(args)
{
    local v = new Vector([1, 5, 2, 5, 3, 5, 4, 5]);
    local u = v.getUnique();
    return u.toList() == [1, 5, 2, 3, 4]
        && u.ofKind(Vector)
        && v.length() == 8;
}
