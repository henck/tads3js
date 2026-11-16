#include <tads.h>
#include <vector.h>

/*
 *   Converting a Vector to a string joins the elements' string
 *   forms with commas.
 */
_main(args)
{
    return toString(new Vector([1, 2, 3])) == '1,2,3'
        && 'v=' + new Vector(['a', 'b']) == 'v=a,b'
        && toString(new Vector()) == '';
}
