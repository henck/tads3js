#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = 'hello, world';
    local y = 'hello, world';
    local z = 'hello';
    return x.compareTo(y) == 0 && z.compareTo(x) < 1;

    
}


