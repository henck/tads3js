#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{  
  return 
       'abcdefgh'.splice(3,4,'xx') == 'abxxgh'
    && 'abcdefgh'.splice(100,0,'xx') == 'abcdefghxx'
    && 'abcdefgh'.splice(-2, 1, 'x') == 'abcdefxh';
}


