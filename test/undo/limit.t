#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   The reference VM keeps the 64 most recent savepoints.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local o = new Foo, n = 0;
    for(local i = 1; i <= 100; i++) { savepoint(); o.a = i; }
    while(undo()) n++;
    return n == 64 && o.a == 36;
}
