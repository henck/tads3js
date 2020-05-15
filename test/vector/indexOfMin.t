#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector(['hello','out','every1','there']);
    return x.indexOfMin({x: x.length()}) == 2
        && x.indexOfMin() == 3;
}


