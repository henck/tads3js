#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   createInstance(...) creates an instance of the target object (so a
 *   base class method can create instances of whichever subclass it's
 *   called on), passing the arguments to the constructor.
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
    local g = GoldCoin.createCoin();
    local s = SilverCoin.createCoin();
    local w = Weighted.createInstance(7, 8);
    return g.ofKind(GoldCoin) && !g.ofKind(SilverCoin)
        && s.ofKind(SilverCoin)
        && g.getSuperclassList() == [GoldCoin]
        && g.isClass() == nil
        && w.weight == 15;
}
