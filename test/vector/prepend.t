#include <tads.h>
#include <vector.h>

/*
 *   prepend(val) inserts val (a list stays one element) before the
 *   first element, and returns self.
 */
_main(args)
{
    local x = new Vector([1, 2, 3]);
    x.prepend('x').prepend([0]);
    return x.toList() == [[0], 'x', 1, 2, 3];
}
