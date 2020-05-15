#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3,4,5]);
    u.appendUnique([3,4,5,6,7]);
    return 
       u.toList() == [1,2,3,4,5,6,7];
}


