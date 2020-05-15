#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{          //  1234567890123456789012345
    local x = 'hello, world, hello world';
    return (
         x.find('world') == 8
      && x.find('world', 12) == 21
      && x.find(R'w.r') == 8
    );
}


