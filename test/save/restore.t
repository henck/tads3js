#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   restoreGame() restores the persistent objects saved by saveGame():
 *   static objects get their saved state, and dynamic objects they
 *   referenced are recreated as saved. Local variables and transient
 *   objects aren't affected, and undo information is discarded. (The
 *   reference VM recreates dynamic objects as new objects, so a local
 *   still refers to the old one.)
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo, t0 = tobj.t;
    o.a = 2;
    sobj.s = 10; sobj.ref = o;
    local r1 = saveGame('test.sav');
    sobj.s = 11; o.a = 3; tobj.t = t0 + 1;
    sobj.ref = nil;
    savepoint();
    local r2 = restoreGame('test.sav');
    return r1 == nil && r2 == nil
        && sobj.s == 10 && sobj.ref.a == 2 && sobj.ref.ofKind(Foo)
        && o.a == 3
        && tobj.t == t0 + 1
        && undo() == nil;
}
