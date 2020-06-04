#include <tads.h>
#include <bignum.h> 
#include "strbuf.h"

_main(args)
{
    local r = function(s) {
      return s.toUpper();
    };

    local t = function(s, idx)
    {
       /* don't capitalize certain small words, except at the beginning */
       if (idx > 1 && ['a', 'an', 'of', 'the', 'to'].indexOf(s.toLower()) != nil)
           return s;

       /* capitalize the first letter */
       return s.substr(1, 1).toTitleCase() + s.substr(2);
    };

    
    return 

    /* Simple */
    'hello abc world abc end'.findReplace('abc', 'xyz') == 'hello xyz world xyz end'

    /* Parallel */
    && 'hello abc world def end'.findReplace(['abc','def'], 'xyz') == 'hello xyz world xyz end'

    /* Parallel multiple replacements */
    && 'hello abc world def end'.findReplace(['abc','def'], ['one', 'two']) == 'hello one world two end'

    /* Parallel too few replacements */
    && 'hello abc world def end'.findReplace(['abc','def'], ['one']) == 'hello one world  end'

    /* Parallel too many replacements */
    && 'hello abc world def end'.findReplace(['abc','def'], ['one', 'two', 'three']) == 'hello one world two end'

    /* Limit */
    && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceAll, 1, 1) == 'hello xyz world abc end'

    /* ReplaceOnce */
    && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceOnce) == 'hello xyz world abc end'

    /* Index */
    && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceAll, 12) == 'hello abc world xyz end'  

    /* Callback */
    && 'hello abc world abc end'.findReplace(R'abc', r, ReplaceAll) == 'hello ABC world ABC end'  

    /* Anonfunc */
    && 'hello abc world abc end'.findReplace(R'abc', {s: s.toUpper()}, ReplaceAll) == 'hello ABC world ABC end'  

    /* Callback in array of replacements */
    && 'hello abc world def end'.findReplace(['abc', 'def'], ['xyz', {s: s.toUpper()}], ReplaceAll) == 'hello xyz world DEF end'  

    /* Titlecase from docs */
    && 'the way to the postoffice'.findReplace(R'%<(<alphanum>+)%>', t, ReplaceAll) == 'The Way to the Postoffice'

    /* Back reference replacements */
    && '100 -200 300 -400 500'.findReplace(R'-(<digit>+)', '<red>(%1)</red>', ReplaceAll) 
    == '100 <red>(200)</red> 300 <red>(400)</red> 500';    
    
}


