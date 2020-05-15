#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1, 2, 3].sublist(2) == [2, 3]
    && [1, 2, 3].sublist(2, 1) == [2]
    && [1, 2, 3, 4, 5].sublist(1, -2) == [1, 2, 3]
    && [1, 2, 3, 4, 5].sublist(2, -2) == [2, 3];
}


