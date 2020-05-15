#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 
       [1,2,3,4,5].join('') == '12345'
       && [1,2,3,4,5].join(',') == '1,2,3,4,5';
}


