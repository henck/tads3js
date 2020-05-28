#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
#include "dict.h"


class A: object
  v1 = 0
  v2 = 0
;

class B: object
  v3 = 0
  v4 = 0
;

c: A, B
  v5 = 0
  v6 = 0
;

_main(args)
{
  return A.isClass() == true
      && B.isClass() == true
      && c.isClass() == nil;
}


