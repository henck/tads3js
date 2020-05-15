#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1, 5, 2, 5, 3, 5, 4, 5].getUnique() == [1,5,2,3,4];
}


