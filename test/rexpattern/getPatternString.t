#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = R'abc';
    return x.getPatternString() == 'abc';
}


