#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = [1,2,3,4,5].splice(0,2,'a');
    local y = [1,2,3,4,5,'a'];
    return x == y;
}


