#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local v = new Vector([1,2,3,4,3,5,3]);
    v.removeElement(3);
    return 
       v.toList() == [1,2,4,5];
}


