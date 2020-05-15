#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local lst = [1,2,3];
    local cnt = 0;
    lst.forEach(function(x) { cnt++; });
    return cnt == 3;
}


