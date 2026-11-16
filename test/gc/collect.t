#include <tads.h>
#include "../runtimeError.h"

/*
 *   t3RunGC() deletes objects that can't be reached, so firstObj()/nextObj()
 *   no longer find them. Objects referenced from locals, other objects,
 *   collections, or undo information are kept.
 */
class Foo: object n = 0;
class Holder: object ref = nil;

count()
{
    local n = 0;
    for(local x = firstObj(Foo); x != nil; x = nextObj(x, Foo)) n++;
    return n;
}

make(n) { for(local i = 0; i < n; i++) new Foo(); }

_main(args)
{
    t3RunGC();
    local base = count();
    make(5);
    local c1 = count();
    t3RunGC();
    local c2 = count();

    // Reachable from a local, an object, a vector, a lookup table.
    local keep = new Foo(), h = new Holder(), v = new Vector(2), t = new LookupTable();
    h.ref = new Foo();
    v.append(new Foo());
    t['k'] = [new Foo()];
    make(3);
    t3RunGC();
    local c3 = count();

    // Kept by undo information: the old value of a changed property.
    savepoint();
    h.ref = nil;
    t3RunGC();
    local c4 = count();
    undo();
    local c5 = h.ref != nil;

    // An object created after a savepoint and dropped is collected.
    savepoint();
    h.ref = new Foo();
    undo();
    t3RunGC();
    local c6 = count();
    return c1 == base + 5 && c2 == base && c3 == base + 4 && c4 == base + 4 && c5 && c6 == base + 4
        && keep != nil;
}
