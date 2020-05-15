#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    // This test is interesting because it calls meta-index 0.
    return 'abc'.length() == 3;
}


