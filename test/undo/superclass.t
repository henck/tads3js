#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   setSuperclassList() is undone.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo;
    savepoint();
    o.setSuperclassList([Bar]);
    local r1 = o.ofKind(Bar);
    undo();
    return r1 && o.ofKind(Foo) && !o.ofKind(Bar);
}
