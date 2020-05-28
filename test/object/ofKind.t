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
  return A.ofKind(Vector) == nil
      && C.ofKind(A) == true
      && A.ofKind(Object) == true
      && (new Vector()).ofKind(Vector) == true
      && (new Vector()).ofKind(Dictionary) == nil;
}


