#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector();
    x.append('a');
    x.append('b');
    return x.toList() == ['a','b'];
}


