#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local u = new Vector([1,5,3,2,4]);
    local v = new Vector([1,2,3,4,5]);
    local w = new Vector(['hello','world!','out','me']);
    u.sort();
    v.sort(true);
    w.sort(nil, {a,b: a.length() - b.length()});
    return 
       u.toList() == [1,2,3,4,5]
    && v.toList() == [5,4,3,2,1]
    && w.toList() == ['me','out','hello','world!'];
}


