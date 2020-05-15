#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3,4,5]);
    x.removeElementAt(2).removeElementAt(-2);
    return x.toList() == [1,3,5];
}


