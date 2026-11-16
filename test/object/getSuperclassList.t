#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include <dict.h>
#include "../runtimeError.h"

/*
 *   getSuperclassList() returns the immediate superclasses, in order. A
 *   class defined with no explicit superclass (": object") reports
 *   TadsObject; intrinsic classes report their intrinsic superclass, up
 *   to Object, which has none.
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
  local v = new Vector();
  return C.getSuperclassList() == [B, A]
      && (new C()).getSuperclassList() == [C]
      && A.getSuperclassList() == [TadsObject]
      && plainObj.getSuperclassList() == [TadsObject]
      && v.getSuperclassList() == [Vector]
      && Vector.getSuperclassList() == [Collection]
      && Collection.getSuperclassList() == [Object]
      && TadsObject.getSuperclassList() == [Object]
      && Object.getSuperclassList() == [];
}
