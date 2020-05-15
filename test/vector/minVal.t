#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local v = new Vector(['ab','bdd','ceed','x']);
    return v.minVal({x: x.length()}) == 'x';
}


