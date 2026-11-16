#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. Strings and lists built at run time (in preinit) are stored too.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local s = 'abc'; s += 'def'; local l = [1]; l += 2; holder.a = s; holder.b = l;
        return true;
    }
    return holder.a == 'abcdef' && holder.b == [1, 2];
}
