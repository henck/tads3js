#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = [1,2,3,4];
    local y = x.mapAll({x: x * 2});
    return y == [2,4,6,8];
}


