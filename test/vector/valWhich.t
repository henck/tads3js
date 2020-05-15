#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local v = new Vector(['ab','bdd','cee','x']);
    return v.valWhich({x: x.length() == 3}) == 'bdd';
}


