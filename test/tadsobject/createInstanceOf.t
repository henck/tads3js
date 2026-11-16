#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   TadsObject.createInstanceOf(...) creates an instance with the given
 *   superclasses, in order. A [class, args...] list argument calls that
 *   class's constructor with the arguments; a plain class doesn't call it.
 *   With no arguments it creates a plain TadsObject.
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
    local d = TadsObject.createInstanceOf([Ca, log, 'x', 'y'], Cb, [Cc, log]);
    local e = TadsObject.createInstanceOf();
    return d.getSuperclassList() == [Ca, Cb, Cc]
        && d.ofKind(Cb)
        && log.toList() == ['A:x,y', 'C']
        && e.getSuperclassList() == [TadsObject]
        && d.isTransient() == nil;
}
