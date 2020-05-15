#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3]);
    local v = u + 4; 
    local w = u + [4,5];
    local z = new Vector([4,5]);
    local y = u + z;
    return v.toList() == [1,2,3,4]
        && w.toList() == [1,2,3,4,5]
        && y.toList() == [1,2,3,4,5];
}


