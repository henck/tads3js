#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,2,3,4,5]);
    u.splice(2,2,'x','y');
    return 
       u.toList() == [1,'x','y',4,5];
}


