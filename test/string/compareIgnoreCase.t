#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = 'hello world';
    local y = 'HELLo WORLD';
    local z = 'hEllo';
    return x.compareIgnoreCase(y) == 0 && z.compareIgnoreCase(x) < 1;
}


