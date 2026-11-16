#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   getPropParams(prop) returns [required args, optional args, varargs?];
 *   an undefined property gives [0, 0, nil]. On a string, substr reports
 *   its parameters; on the String class object itself the method isn't a
 *   property, so it gives [0, 0, nil].
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
    return 'abc'.getPropParams(&substr) == [1, 1, nil]
        && String.getPropParams(&substr) == [0, 0, nil]
        && C.getPropParams(&none) == [0, 0, nil]
        && C.getPropParams(&one) == [1, 0, nil]
        && C.getPropParams(&two) == [2, 0, nil]
        && C.getPropParams(&opt) == [1, 1, nil]
        && C.getPropParams(&vary) == [1, 0, true]
        && C.getPropParams(&v5) == [0, 0, nil]
        && C.getPropParams(&dontexist) == [0, 0, nil];
}
