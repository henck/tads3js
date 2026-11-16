#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   getMethod(prop) returns a function pointer for a method, the text of
 *   a double-quoted string, nil for other data or undefined properties,
 *   and the same anonymous function that setMethod() was given.
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
    local m = Weighted.getMethod(&double);
    local o = new Weighted(1, 1);
    local anon = {x: x + 1};
    o.setMethod(&inc, anon);
    return dataType(m) == TypeFuncPtr
        && Weighted.getMethod(&desc) == 'A weighted thing.'
        && Weighted.getMethod(&weight) == nil
        && Weighted.getMethod(&nothere) == nil
        && o.getMethod(&inc) == anon;
}
