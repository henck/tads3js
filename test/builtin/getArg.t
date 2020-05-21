#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

myfunc(x) {
  return getArg(1);
}
    
_main(args)
{
  return myfunc(3) == 3;
}


