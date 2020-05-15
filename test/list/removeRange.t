#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1,2,3,4,5].removeRange(2,4) == [1,5]
       && [1,2,3,4,5].removeRange(2,2) == [1,3,4,5]
       && [1,2,3,4,5].removeRange(-3, -2) == [1,2,5];
}


