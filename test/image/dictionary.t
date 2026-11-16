#include <tads.h>
#include <vector.h>
#include <lookup.h>
#include <strbuf.h>
#include <bytearr.h>
#include <bignum.h>
#include <dict.h>
#include <strcomp.h>

/*
 *   Objects created during preinit are stored in the image file. A Dictionary keeps its words and comparator.
 */
class Thing: object weight = 3;
holder: object a = nil b = nil;

_main(args)
{
    if(t3GetVMPreinitMode()) {
        local d = new Dictionary(new StringComparator(6, nil, [])); d.addWord(holder, 'lantern', &noun); holder.a = d;
        return true;
    }
    return holder.a.findWord('lantern', &noun)[1] == holder && holder.a.isWordDefined('LANTER') && !holder.a.isWordDefined('lamp');
}
