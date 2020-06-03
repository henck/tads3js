#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{
    return 'abcdefghi'.match('def', 4) == 3
        && 'abcdef'.match('abc') == 3
        && 'abbbbcdefg'.match(R'ab+c') == 6
        && 'xxxabbbbcdefg'.match(R'ab+c', 4) == 6
        && 'xabbbbbcddd'.match(R'ab+c') == nil;;
}


