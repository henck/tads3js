#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return [1,2,3].intersect([3,4,5]) == [3]
        && [1,2,3,3,3,4].intersect([2,3,4,5,6,7,8,9,10,11]) == [2,3,3,3,4]
        && [1,2,3,4,5].intersect([3,3,3,3,3,3,3,3,4]) == [3,4];
}


