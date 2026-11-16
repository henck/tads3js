#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. An anonymous function keeps its code and the variables it captured.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local n = 10; holder.a = {x: x + n}; holder.b = new function(y) { return y * 2; };
        return true;
    }
    return (holder.a)(5) == 15 && (holder.b)(4) == 8;
}
