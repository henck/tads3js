#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector();
    local y = new Vector([1,2,3]);
    return x.length() == 0 && y.length() == 3;
}


