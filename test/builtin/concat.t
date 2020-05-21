#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

_main(args)
{
  return concat('a',nil,3,[4,5,6]) == 'a34,5,6';
}


