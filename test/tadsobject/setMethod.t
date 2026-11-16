#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   setMethod(prop, func) makes func a method of the object: a function
 *   pointer, an anonymous function (which keeps its own 'self'), an
 *   anonymous or floating method (which uses the live 'self'), or a
 *   method taken from another object with getMethod().
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
    local a = new Weighted(1, 2), b = new Weighted(10, 20);
    a.setMethod(&sq, square);
    a.setMethod(&add, {x: x + 100});
    a.setMethod(&w2, method() { return self.weight * 2; });
    a.setMethod(&w3, floating);
    b.setMethod(&dbl, Weighted.getMethod(&double));
    return a.sq(5) == 25
        && a.add(1) == 101
        && a.w2() == 6
        && a.w3() == 9
        && b.dbl() == 60
        && a.propDefined(&sq, PropDefDirectly) == true
        && (new Weighted(0, 0)).propDefined(&sq) == nil;
}
