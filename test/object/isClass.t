#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   isClass() is true for objects declared with 'class'.
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
  return A.isClass() == true
      && C.isClass() == true
      && plainObj.isClass() == nil
      && (new A()).isClass() == nil;
}
