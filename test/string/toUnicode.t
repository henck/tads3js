#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{  
  return 
    'ABC'.toUnicode(1) == 65
    && 'ABC'.toUnicode(-1) == 67
    && 'ABC'.toUnicode() == [65,66,67];
}


