#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return ['hello','out','every1','there'].indexOfMin({x: x.length()}) == 2
        && [1,2,3,6,2,1].indexOfMin() == 1;
}


