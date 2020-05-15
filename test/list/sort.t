#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = ['hello','world','out','there','every1'];
    
    return x.sort()     == ['every1','hello','out','there','world']
        && x.sort(nil)  == ['every1','hello','out','there','world']
        && x.sort(true) == ['world','there','out','hello','every1']
        && x.sort(nil, {a,b: a.length() - b.length()}) == ['out','hello','world','there','every1'];
}


