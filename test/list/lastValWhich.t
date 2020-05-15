#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1, 5, 2, 5, 2, 5, 4, 5].lastValWhich({x: x <= 3}) == 2;
}


