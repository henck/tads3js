#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector(['hello','out','every1','there']);
    return x.indexOfMax({x: x.length()}) == 3
        && x.indexOfMax() == 4;
}


