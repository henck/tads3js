#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   Converting a list to a string joins the elements' string forms
 *   with commas.
 */
_main(args)
{
    return toString([1, 2, 3]) == '1,2,3'
        && 'l=' + ['a', 'b'] == 'l=a,b'
        && toString([]) == '';
}
