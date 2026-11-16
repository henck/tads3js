#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   setSuperclassList(lst) replaces the superclasses; [TadsObject] makes a
 *   root object (reported as having superclass TadsObject).
 */

constructed: object n = 0;

class Coin: object
    createCoin() { return createInstance(); }
;
class GoldCoin: Coin;
class SilverCoin: Coin;

class Weighted: object
    weight = 0
    construct(a, b) { weight = a + b; constructed.n++; }
    double() { return weight * 2; }
    desc = "A weighted thing."
;

class Ca: object
    construct(log, a, b) { log.append('A:' + a + ',' + b); }
    whoami() { return 'Ca'; }
;
class Cb: object
    construct(log, a, b, c) { log.append('B'); }
    whoami() { return 'Cb'; }
;
class Cc: object
    construct(log) { log.append('C'); }
;

square(x) { return x * x; }
method floating() { return self.weight * 3; }

_main(args)
{
    local o = new Weighted(1, 2);
    o.setSuperclassList([TadsObject]);
    local b1 = o.getSuperclassList() == [TadsObject] && o.weight == 3 && !o.ofKind(Weighted);
    o.setSuperclassList([Ca, Cb]);
    local b2 = o.getSuperclassList() == [Ca, Cb] && o.ofKind(Cb) && o.whoami() == 'Ca';
    o.setSuperclassList([Cb]);
    local b3 = o.getSuperclassList() == [Cb] && o.whoami() == 'Cb';
    return b1 && b2 && b3;
}
