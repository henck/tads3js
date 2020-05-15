#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{  
  return 
     'one,two,three'.split(',') == ['one', 'two', 'three']
  && 'one,two, three, four'.split(R',<space>*') == ['one', 'two', 'three', 'four']
  && 'one,two,three'.split(',', 2) == ['one', 'two,three']
  && 'abcdefghi'.split(2) == ['ab', 'cd', 'ef', 'gh', 'i'];
}


