#include <tads.h>
#include <vector.h>

/*
 *   fillValue(value, start?, count?) fills from start (default 1;
 *   negative counts from the end) for count elements (default: to the
 *   end of the existing elements); returns self.
 */
_main(args)
{
    local x = new Vector(['a', 'b', 'c']);
    local res1 = x.fillValue('A', 2).toList() == ['a', 'A', 'A'];
    local y = new Vector();
    local res2 = y.fillValue('A', 1, 5).toList() == ['A', 'A', 'A', 'A', 'A'];
    local res3 = new Vector([1, 2, 3]).fillValue('z').toList() == ['z', 'z', 'z'];
    local res4 = new Vector([1, 2, 3, 4]).fillValue('n', -2).toList() == [1, 2, 'n', 'n'];
    local res5 = new Vector([1, 2, 3, 4]).fillValue('c', 2, 2).toList() == [1, 'c', 'c', 4];
    local res6 = new Vector(10).fillValue('x').length() == 0;
    return res1 && res2 && res3 && res4 && res5 && res6;
}
