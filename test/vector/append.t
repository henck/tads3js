#include <tads.h>
#include <vector.h>

/*
 *   append(val) adds val as a single element (a list stays one
 *   element) and returns self.
 */
_main(args)
{
    local x = new Vector();
    local r = x.append('a');
    x.append([1, 2]);
    r.append('z');
    return x.length() == 3
        && x.toList() == ['a', [1, 2], 'z'];
}
