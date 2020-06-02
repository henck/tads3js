#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 'abcdef'.find('cd') == 3
        && 'abcdef'.find('g') == nil
        && 'abcdef'.find('c',3) == 3
        && 'abcdef'.find('c',4) == nil
        && 'abcabcabc'.find('c', 4) == 6
        && 'abcabcabc'.find('c', 7) == 9
        && 'abcdef123456'.find(R'%d+') == 7;
}


