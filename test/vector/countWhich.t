#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3,4,5]);
    return x.countWhich({x: x >= 3}) == 3;
}


