#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   propType(prop) returns the type of a property's value without
 *   evaluating it, or nil if it isn't defined.
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
    return C.propType(&v5) == TypeInt
        && C.propType(&v2) == TypeSString
        && C.propType(&v3) == TypeList
        && C.propType(&one) == TypeCode
        && C.propType(&nothere) == nil
        && propTypes.propType(&d) == TypeDString
        && propTypes.propType(&o) == TypeObject
        && propTypes.propType(&n) == TypeNil
        && propTypes.propType(&t) == TypeTrue
        && propTypes.propType(&pp) == TypeProp
        && propTypes.propType(&fp) == TypeFuncPtr
        && 'abc'.propType(&length) == TypeNativeCode;
}
