#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{  
  return 
     'abcdef'.substr(3) == 'cdef'
  && 'abcdef'.substr(3,2) == 'cd'
  && 'abcdefghi'.substr(-3) == 'ghi'
  && 'abcdefghi'.substr(-3, 2) == 'gh'
  && 'abcdefghi'.substr(1, -1) == 'abcdefgh'
  && 'abcdefghi'.substr(2, -2) == 'bcdefg'
  && 'abcdefghi'.substr(4, -2) == 'defg'
  && 'abcdefghi'.substr(4, -4) == 'de'
  && 'abcdefghi'.substr(-4, -2) == 'fg';
}


