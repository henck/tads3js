#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,2,3]);
    return x.indexWhich({x: x == 2}) == 2;
}


