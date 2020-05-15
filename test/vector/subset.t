#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,11,3,19,5]);
    u.subset({x: x > 10});
    return 
       u.toList() == [11,19];
}


