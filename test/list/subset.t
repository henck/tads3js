#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [5, 10, 15, 20].subset({x: x > 10}) == [15,20];
}


