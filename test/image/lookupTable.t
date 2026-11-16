#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A LookupTable keeps its entries and default value.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local t = new LookupTable(); t['k'] = 1; t[2] = 'two'; t[holder] = [3]; t.setDefaultValue('dflt'); holder.a = t;
        return true;
    }
    return holder.a['k'] == 1 && holder.a[2] == 'two' && holder.a[holder] == [3] && holder.a['none'] == 'dflt' && holder.a.getEntryCount() == 3;
}
