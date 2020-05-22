#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return List.generate({x: x*2}, 10) == [2,4,6,8,10,12,14,16,18,20];
}


