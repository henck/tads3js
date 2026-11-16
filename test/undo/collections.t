#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Changes to Vector, LookupTable, StringBuffer, ByteArray and Dictionary
 *   objects are undone.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local v = new Vector(5, [1, 2, 3]), t = new LookupTable(), sb = new StringBuffer();
    local ba = new ByteArray(3), d = new Dictionary(nil), o = new Foo;
    t['k'] = 1; sb.append('ab');
    savepoint();
    v[1] = 9; v.append(4); v.insertAt(1, 0); v.removeElementAt(2); v.sort(true);
    t['k'] = 2; t['j'] = 3; t.removeElement('k');
    sb.append('cd'); sb.insert(1, 'x');
    ba[1] = 7; ba.fillValue(5);
    d.addWord(o, 'xyz', &a);
    undo();
    return v.toList() == [1, 2, 3]
        && t.keysToList() == ['k'] && t['k'] == 1
        && toString(sb) == 'ab'
        && ba[1] == 0 && ba[3] == 0
        && d.isWordDefined('xyz') == nil;
}
