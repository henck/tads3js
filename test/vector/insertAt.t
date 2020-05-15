#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3,4,5]);
    x.insertAt(2,'i1','i2').insertAt(-2,'v1','v2').insertAt(0,'x');
    return x.toList() == [1,'i1','i2',2,3,'v1','v2',4,5,'x'];
}


