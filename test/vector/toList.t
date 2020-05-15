#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector(['a','b','c']);
    return x.toList() == ['a','b','c']
        && x.toList(2) == ['b','c']
        && x.toList(2,1) == ['b'];
}


