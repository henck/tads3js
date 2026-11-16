#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   createTransientInstance(...) and createTransientInstanceOf(...)
 *   work like createInstance()/createInstanceOf(), but create transient
 *   objects.
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
    local log = new Vector();
    local a = Weighted.createTransientInstance(1, 1);
    local b = TadsObject.createTransientInstanceOf([Ca, log, 'p', 'q']);
    return a.isTransient() == true
        && a.weight == 2
        && b.isTransient() == true
        && b.ofKind(Ca)
        && log.toList() == ['A:p,q'];
}
