#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
  return toInteger(10) == 10 
      && toInteger(true) == 1
      && toInteger(nil) == 0
      && toInteger('true') == 1
      && toInteger('nil') == 0
      && toInteger('123') == 123
      && toInteger('41', 16) == 65;
        
}


