#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   createIterator() iterates over a snapshot: later changes to a Vector
 *   or LookupTable don't affect it.
 */
_main(args)
{
    local v = new Vector([1, 2]);
    local vi = v.createIterator();
    v.append(3);
    v[1] = 9;
    local vs = [];
    while(vi.isNextAvailable()) vs += vi.getNext();

    local t = ['a' -> 1];
    local ti = t.createIterator();
    t['b'] = 2;
    local n = 0;
    while(ti.isNextAvailable()) { ti.getNext(); n++; }

    return vs == [1, 2] && n == 1;
}
