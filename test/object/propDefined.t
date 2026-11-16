#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   propDefined(prop, flags?) with PropDefAny (default),
 *   PropDefDirectly, PropDefInherits and PropDefGetClass.
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
    return C.propDefined(&v5) == true
        && C.propDefined(&v1) == true
        && C.propDefined(&nothere) == nil
        && C.propDefined(&v5, PropDefDirectly) == true
        && C.propDefined(&v1, PropDefDirectly) == nil
        && C.propDefined(&v5, PropDefInherits) == nil
        && C.propDefined(&v1, PropDefInherits) == true
        && C.propDefined(&nothere, PropDefInherits) == nil
        && C.propDefined(&v5, PropDefGetClass) == C
        && C.propDefined(&v1, PropDefGetClass) == A
        && C.propDefined(&x, PropDefGetClass) == C
        && c.propDefined(&none, PropDefGetClass) == B
        && C.propDefined(&nothere, PropDefGetClass) == nil;
}
