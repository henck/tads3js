#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return ['hello','out','every1','there'].indexOfMax({x: x.length()}) == 3
        && [1,2,3,6,2,1].indexOfMax() == 4;
}


