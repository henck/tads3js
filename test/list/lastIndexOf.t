#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new StringBuffer();
    return 
       [1,2,3,3,4,1,5].lastIndexOf(1) == 6 
    && [1,2,3,4,5,6].lastIndexOf(7) == nil
    && ['a',1,2,3,4,'a'].lastIndexOf('a') == 6
    && [x,1,2,3,x].lastIndexOf(x) == 5;
}


