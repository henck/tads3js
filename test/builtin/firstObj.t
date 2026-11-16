#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   firstObj(cls?, flags?) and nextObj(obj, cls?, flags?) enumerate the
 *   objects of a class: instances only by default (ObjInstances), classes
 *   only (ObjClasses), or both (ObjAll).
 */

class K: object;
class K2: K;
k1: K;
k2: K2;

collect(cls, flags)
{
    local v = new Vector();
    for(local o = firstObj(cls, flags); o != nil; o = nextObj(o, cls, flags)) v.append(o);
    return v.toList();
}
same(a, b) { return a.length() == b.length() && a.subset({x: b.indexOf(x) == nil}) == []; }

_main(args)
{
    local k3 = new K();
    local inst = collect(K, ObjInstances);
    local cls = collect(K, ObjClasses);
    local all = collect(K, ObjAll);
    local def = new Vector();
    for(local o = firstObj(K); o != nil; o = nextObj(o, K)) def.append(o);
    local any = 0;
    for(local o = firstObj(); o != nil; o = nextObj(o)) if(o == k1) any++;
    return same(inst, [k1, k2, k3])
        && same(cls, [K2])
        && same(all, [k1, k2, k3, K2])
        && same(def.toList(), inst)
        && any == 1;
}
