#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   Each undo() goes back one savepoint; a savepoint with no changes
 *   can still be undone.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo;
    savepoint(); o.a = 2; savepoint(); o.a = 3; savepoint(); o.a = 4;
    savepoint();
    local r = [];
    for(local i = 1; i <= 5; i++) { r += undo(); r += o.a; }
    return r == [true, 4, true, 3, true, 2, true, 1, nil, 1];
}
