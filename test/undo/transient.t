#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Transient objects aren't affected by undo.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local tr = new transient Foo, t0 = tobj.t;
    savepoint();
    tr.a = 2; tobj.t = t0 + 1;
    undo();
    return tr.a == 2 && tobj.t == t0 + 1;
}
