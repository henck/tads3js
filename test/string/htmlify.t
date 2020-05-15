#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"
    
_main(args)
{  
  return 
    '&<hello\t\n   there'.htmlify(HtmlifyTranslateWhitespace) == '&amp;&lt;hello<tab><br> &nbsp;&nbsp;there';
}


