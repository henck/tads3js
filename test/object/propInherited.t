#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   propInherited(prop, origTarget, definingObj, flags?) tells whether
 *   'inherited' in definingObj's method would find a definition, following
 *   origTarget's inheritance order (C: B, A gives C, B, A).
 */

class A: object
    v1 = 1
    v2 = 'two'
    one(x) { return x; }
    x() { return 'A' + inherited(); }
;
class B: object
    v3 = [3]
    none() { }
    vary(x, ...) { }
    x() { return 'B' + inherited(); }
;
class C: B, A
    v5 = 5
    two(x, y) { }
    opt(x, y?) { }
    x() { return 'C' + inherited(); }
;
transient tObj: object;
plainObj: object;

f() { }
propTypes: object
    d = "printed"
    o = plainObj
    n = nil
    t = true
    pp = &v1
    fp = f
;

_main(args)
{
    local c = new C();
    return C.propInherited(&x, C, C) == true
        && C.propInherited(&x, C, B) == true
        && C.propInherited(&x, C, A) == nil
        && C.propInherited(&x, C, C, PropDefGetClass) == B
        && C.propInherited(&x, C, B, PropDefGetClass) == A
        && C.propInherited(&x, C, A, PropDefGetClass) == nil
        && B.propInherited(&x, B, B) == nil
        && c.propInherited(&x, c, C) == true
        && c.x() == 'CBA'
        && (new B()).x() == 'B';
}
