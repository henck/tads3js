#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local v = new Vector([1,2,3]);
    local cnt = 0;
    v.forEachAssoc(function(idx, x) { cnt++; });
    return cnt == 3;
}


