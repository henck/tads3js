#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

_main(args)
{
  return rexMatch('ab+c', 'abbbc') == 5
      && rexMatch('abc', 'xabc') == nil
      && rexMatch('abc', 'abcabcabc', -3) == 3
      && rexMatch('abc', 'xabc', 2) == 3
      && rexGroup(0) == [2, 3, 'abc'];
}


