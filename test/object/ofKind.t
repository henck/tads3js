#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   ofKind(cls) is true if the object is cls or an instance or subclass
 *   of it; everything is an Object.
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
  return A.ofKind(Vector) == nil
      && C.ofKind(A) == true
      && C.ofKind(C) == true
      && c.ofKind(C) == true
      && c.ofKind(B) == true
      && A.ofKind(C) == nil
      && A.ofKind(Object) == true
      && A.ofKind(TadsObject) == true
      && (new Vector()).ofKind(Vector) == true
      && (new Vector()).ofKind(Collection) == true
      && (new Vector()).ofKind(Dictionary) == nil
      && 'abc'.ofKind(String) == true
      && [1].ofKind(List) == true
      && [1].ofKind(Collection) == true;
}
