#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Saved and restored collections keep their contents.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local t = new LookupTable(), v = new Vector(5, [1, 'two', [3]]);
    t['k'] = v; t[2] = 'x';
    local sb = new StringBuffer(); sb.append('abc');
    sobj.ref = [t, sb, new ByteArray(2), 1.5, 'str'];
    saveGame('test.sav');
    sobj.ref = nil;
    restoreGame('test.sav');
    local l = sobj.ref, t2 = l[1];
    return t2['k'].toList() == [1, 'two', [3]] && t2[2] == 'x'
        && toString(l[2]) == 'abc' && l[3].length() == 2
        && toString(l[4]) == '1.5' && l[5] == 'str';
}
