#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   undo() undoes property changes back to the last savepoint, and
 *   returns true; with no savepoint left it returns nil. Properties added
 *   since the savepoint are removed. Local variables aren't affected.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo, loc = 1;
    local r1 = undo();
    savepoint();
    o.a = 2; o.b = 3; o.a = 4; loc = 2;
    local r2 = undo();
    local r3 = undo();
    return r1 == nil && r2 == true && r3 == nil
        && o.a == 1 && !o.propDefined(&b) && loc == 2;
}
