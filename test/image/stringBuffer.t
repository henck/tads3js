#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A StringBuffer keeps its text.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local sb = new StringBuffer(); sb.append('h\u00e9llo'); holder.a = sb;
        return true;
    }
    return toString(holder.a) == 'h\u00e9llo' && holder.a.length() == 5;
}
