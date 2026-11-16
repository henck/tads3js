#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Objects created after a savepoint survive undo with their state
 *   intact, but references to them from undone properties are gone.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo;
    savepoint();
    local n = new Foo;
    n.a = 5; o.b = n;
    undo();
    return n.a == 5 && !o.propDefined(&b);
}
