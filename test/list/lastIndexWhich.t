#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [5, 10, 15, 20, 8].lastIndexWhich({x: x > 10}) == 4
        && [1,2,3,3,3,3,4,5].lastIndexWhich({x: x == 3}) == 6;
}


