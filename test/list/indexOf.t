#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new StringBuffer();
    return 
       [1,2,3,3,4,5].indexOf(1) == 1 
    && [1,2,3,4,5,6].indexOf(7) == nil
    && [1,2,3,4,'a'].indexOf('a') == 5
    && [x,1,2,3].indexOf(x) == 1;
}


