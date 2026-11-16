#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
#include "dict.h"

class A: object
;

_main(args)
{
  return IntrinsicClass.isIntrinsicClass(Vector) == true
      && IntrinsicClass.isIntrinsicClass(ByteArray) == true
      && IntrinsicClass.isIntrinsicClass(Dictionary) == true
      && IntrinsicClass.isIntrinsicClass(new Vector()) == nil
      && IntrinsicClass.isIntrinsicClass(1) == nil
      && IntrinsicClass.isIntrinsicClass(A) == nil;
}


