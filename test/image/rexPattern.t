#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A RexPattern keeps its pattern.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        holder.a = new RexPattern('<nocase>b+');
        return true;
    }
    return rexSearch(holder.a, 'aBBc') == [2, 2, 'BB'] && holder.a.getPatternString() == '<nocase>b+';
}
