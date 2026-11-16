#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A ByteArray keeps its bytes.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local b = new ByteArray(3); b[1] = 1; b[2] = 255; holder.a = b;
        return true;
    }
    return holder.a.length() == 3 && holder.a[1] == 1 && holder.a[2] == 255 && holder.a[3] == 0;
}
