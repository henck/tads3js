#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1, 2, 3].prepend(0) == [0,1,2,3];
}


