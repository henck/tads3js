#include <tads.h>
#include <vector.h>

/*
 *   removeElementAt(index) removes one element (negative counts from
 *   the end), and returns self.
 */
_main(args)
{
    local x = new Vector([1, 2, 3, 4, 5]);
    x.removeElementAt(2).removeElementAt(-2).removeElementAt(1).removeElementAt(-1);
    return x.toList() == [3];
}
