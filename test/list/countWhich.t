#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1,2,3,3,4,5].countWhich({x: x >= 3}) == 4;
}


