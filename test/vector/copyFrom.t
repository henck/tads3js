#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector([1,2,3,4,5,6]);
    local res1 = x.copyFrom(['a','b','c','d'], 2, 4, 2).toList() == [1,2,3,'b','c',6];
    
    local y = new Vector(['x','y']);
    local res2 = y.copyFrom(x, 1, 2, 5).toList() == ['x',1,2,3,'b','c'];
    
    return res1 && res2;
}