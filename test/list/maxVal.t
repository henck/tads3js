#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = ['hello','world','out','there','every1'];
    local y = x.maxVal({x: x.length()});
    return y == 'every1';
}


