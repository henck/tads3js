#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1,2,3,4,5].append(6) == [1,2,3,4,5,6];
}


