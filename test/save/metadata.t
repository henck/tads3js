#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   saveGame() takes an optional LookupTable of metadata.
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    local t = new LookupTable();
    t['Room'] = 'Kitchen'; t[1] = 'ignored';
    return saveGame('test.sav', t) == nil;
}
