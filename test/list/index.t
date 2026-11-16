#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   [] gets elements. Assigning lst[i] = x produces a new list (value
 *   semantics): other references to the old list are unaffected.
 *   (Unlike a Vector, a list can't be extended this way: assigning past
 *   the end is an "index out of range" error - not tested here.)
 */
_main(args)
{
    local a = [1, 2, 3];
    local b = a;
    b[2] = 'x';
    b[3] = 'y';
    return a[1] == 1 && a[3] == 3
        && b == [1, 'x', 'y']
        && a == [1, 2, 3];
}
