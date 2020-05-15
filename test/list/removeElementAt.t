#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1,2,3].removeElementAt(2) == [1,3]
       && [1,2,3].removeElementAt(-2) == [1,3];
}


