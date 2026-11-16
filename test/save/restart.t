#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   restartGame() resets static persistent objects to their initial
 *   state. Dynamic objects, transient objects and locals aren't affected,
 *   and undo information is discarded.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local s0 = sobj.s, o = new Foo, t0 = tobj.t;
    sobj.s = s0 + 1; sobj.x = 1; o.a = 5; tobj.t = t0 + 1;
    savepoint();
    local r = restartGame();
    return r == nil && sobj.s == s0 && !sobj.propDefined(&x)
        && o.a == 5 && tobj.t == t0 + 1 && undo() == nil;
}
