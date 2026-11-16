#include <tads.h>
#include <vector.h>

/*
 *   join(sep?) concatenates the elements' string forms, with an
 *   optional separator.
 */
_main(args)
{
    local x = new Vector([1, 2, 3, 4, 5]);
    return x.join('') == '12345'
        && x.join() == '12345'
        && x.join(',') == '1,2,3,4,5'
        && new Vector(['a', 1, 'b']).join('-') == 'a-1-b'
        && new Vector().join(',') == '';
}
