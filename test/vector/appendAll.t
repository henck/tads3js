#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3]);
    local metalist = [4,5,6].getUnique();
    local y = new Vector();
    return y.appendAll(x).appendAll(metalist).appendAll([7,8,9]).appendAll(10).toList() == [1,2,3,4,5,6,7,8,9,10];
}


