#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3,4,5]);
    x.prepend('x');
    return x.toList() == ['x',1,2,3,4,5];
}


