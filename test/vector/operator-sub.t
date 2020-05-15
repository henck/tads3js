#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local v = new Vector([1,2,3,4]);
    local u = v - 1;
    local w = v - [1,3];
    local z = new Vector([1,3]);
    local x = v - z;
    return u.toList() == [2,3,4]
        && w.toList() == [2,4]
        && x.toList() == [2,4];
}


