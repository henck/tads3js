#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3,4,5]);
    local v = new Vector([1,2,3,4,5]);
    local w = new Vector([1,2,3,4,5]);
    return 
       u.removeRange(2,4).toList() == [1,5]
       && v.removeRange(2,2).toList() == [1,3,4,5]
       && w.removeRange(-3, -2).toList() == [1,2,5];
}


