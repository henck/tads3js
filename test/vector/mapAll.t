#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3,4,5]);
    local v = u.mapAll({x: x*2});
    return 
       v.toList() == [2,4,6,8,10];
}


