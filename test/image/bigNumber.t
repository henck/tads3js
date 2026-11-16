#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A BigNumber keeps its value and precision.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        holder.a = new BigNumber('-123.456', 12); holder.b = new BigNumber('1e-20');
        return true;
    }
    return toString(holder.a) == '-123.456' && holder.a.getPrecision() == 12 && toString(holder.b) == '.00000000000000000001';
}
