#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   join(sep?) concatenates the elements' string forms, with an
 *   optional separator.
 */
_main(args)
{
    return [1, 2, 3, 4, 5].join('') == '12345'
        && [1, 2, 3, 4, 5].join() == '12345'
        && [1, 2, 3, 4, 5].join(',') == '1,2,3,4,5'
        && ['a', 1, 'b'].join(' - ') == 'a - 1 - b'
        && ['x'].join(',') == 'x'
        && [].join(',') == '';
}
