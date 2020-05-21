#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    local s = new StringBuffer();
    s.append('a');
    s.append('b');
    s.append('c');
    return toString('123') == '123'
        && toString(45) == '45'
        && toString(65, 16) == '41'
        && toString(true) == 'true'
        && toString(nil) == 'nil'
        && toString([1,2,3]) == '1,2,3'
        && toString(new Vector([1,2,3])) == '1,2,3'
        && toString(s) == 'abc';

        
}


