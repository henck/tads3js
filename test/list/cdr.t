#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1,2,3,3,4,5].cdr() == 5 && [].cdr() == nil;
}


