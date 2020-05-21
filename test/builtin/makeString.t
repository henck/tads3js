#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

_main(args)
{
  return makeString('A') == 'A'
      && makeString('A', 0) == '' 
      && makeString('A', 5) == 'AAAAA'
      && makeString(65, 5) == 'AAAAA'
      && makeString([65,66,67], 2) == 'ABCABC'
      && makeString(new Vector([65,66,67]), 2) == 'ABCABC';
}


