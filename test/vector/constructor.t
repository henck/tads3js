#include <tads.h>
#include <vector.h>

/*
 *   new Vector() and new Vector(n) are empty (n is only an allocation
 *   hint); new Vector(n, m) holds m nils; new Vector(list or vector) copies
 *   the elements, optionally with an allocation size first.
 */
_main(args)
{
    local a = new Vector();
    local b = new Vector(10);
    local c = new Vector(10, 5);
    local d = new Vector([1, 2, 3]);
    local e = new Vector(10, [1, 2, 3]);
    local f = new Vector(d);
    f[1] = 99;                          // copy is independent
    return a.length() == 0
        && b.length() == 0
        && c.length() == 5 && c.toList() == [nil, nil, nil, nil, nil]
        && d.toList() == [1, 2, 3]
        && e.toList() == [1, 2, 3]
        && f.toList() == [99, 2, 3]
        && d.toList() == [1, 2, 3];
}
