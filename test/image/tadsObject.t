#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A TadsObject created in preinit keeps its class and properties.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local o = new Thing(); o.name = 'made'; holder.a = o;
        return true;
    }
    return holder.a.ofKind(Thing) && holder.a.name == 'made' && holder.a.weight == 3;
}
