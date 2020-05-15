#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = 'hello';
    return x.startsWith('hel');
}


