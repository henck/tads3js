#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
#include "dict.h"


class A: object
;

class B: object
;

class C: A, B
;

_main(args)
{
  local v = new Vector();
  return C.getSuperclassList() == [A,B]
      && v.getSuperclassList() == [Vector]
      && Vector.getSuperclassList() == [Object]
      && Object.getSuperclassList() == [];
}


