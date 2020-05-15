#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3,4,5]);
    local v = new Vector([1,2,3,4,5]);
    u.setLength(7);
    v.setLength(2);
    return 
       u.toList() == [1,2,3,4,5,nil,nil]
    && v.toList() == [1,2];
}


