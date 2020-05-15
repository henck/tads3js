#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local x = new Vector(['a','b','c']);
    local res1 = x.fillValue('A', 2).toList() == ['a','A','A'];

    local y = new Vector();
    local res2 = y.fillValue('A', 1, 5).toList() == ['A','A','A','A','A'];

    return res1 && res2;
}


