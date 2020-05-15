#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3]);
    return x.applyAll({x: x*2}).toList() == [2,4,6];
}


