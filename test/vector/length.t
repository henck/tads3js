#include <tads.h>
#include <vector.h>

/*
 *   length() is the number of elements actually stored.
 */
_main(args)
{
    local x = new Vector();
    local y = new Vector([1, 2, 3]);
    local z = new Vector(10);
    y.append(4);
    y.removeElementAt(1);
    return x.length() == 0 && y.length() == 3 && z.length() == 0;
}
