#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

_main(args)
{
  return rexSearch('abc', 'helloabc') == [6,3,'abc']
      && rexSearch('abc', 'xabcyabc', 3) == [6,3,'abc']
      && rexSearch('abc', 'xabcyabc', -3) == [6,3,'abc'];
}




 
