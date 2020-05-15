#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1,2,3].insertAt(1, 'a', 'b') == ['a','b',1,2,3]
       && [1,2,3].insertAt(-2, 'x') == [1,'x',2,3]
       && [1,2,3].insertAt(4, 'x') == [1,2,3,'x'];
}


