#include <tads.h>
#include <lookup.h>

/*
 *   LookupTable is a Collection: foreach visits the values, and
 *   createIterator() returns an iterator whose getCurKey()/getCurVal()
 *   give the current entry's key and value.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2, 'c' -> 3];

    local sum = 0;
    foreach(local v in t) sum += v;

    local pairs = new Vector();
    local it = t.createIterator();
    while(it.isNextAvailable()) {
        local v = it.getNext();
        if(v != it.getCurVal()) return nil;
        pairs.append(it.getCurKey() + v);
    }

    return sum == 6
        && pairs.toList().sort() == ['a1', 'b2', 'c3'];
}
