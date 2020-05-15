#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local lst = [1,2,3];
    local cnt = 0;
    lst.forEachAssoc(function(idx, x) { cnt = cnt + idx + x; });
    return cnt == 12; // 1 + 2 + 3 plus 1 + 2 + 3
}
