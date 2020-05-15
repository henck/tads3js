#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1,2,3,3,4,5].car() == 1 && [].car() == nil;
}


