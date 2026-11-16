#include <tads.h>
#include <vector.h>

/*
 *   Vector is a Collection: foreach visits the elements in order.
 *   createIterator() iterates over a snapshot, with getCurKey() giving
 *   the index. createLiveIterator() sees changed values, but (in the
 *   reference VM) its length is fixed when it's created.
 */
_main(args)
{
    local v = new Vector(['a', 'b', 'c']);
    local s = '';
    foreach(local x in v) s += x;

    local snap = v.createIterator();
    local live = v.createLiveIterator();
    v[2] = 'X';
    v.append('d');
    local keys = '';
    while(snap.isNextAvailable()) { snap.getNext(); keys += toString(snap.getCurKey()) + snap.getCurVal(); }
    local l = '';
    while(live.isNextAvailable()) l += live.getNext();

    return s == 'abc' && keys == '1a2b3c' && l == 'aXc';
}
