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
  rexReplace('abc', 'hello abc world abc end', 'xyz') == 'hello xyz world xyz end'

  /* Parallel */
  && rexReplace(['abc','def'], 'hello abc world def end', 'xyz') == 'hello xyz world xyz end'

  /* Parallel multiple replacements */
  && rexReplace(['abc','def'], 'hello abc world def end', ['one', 'two']) == 'hello one world two end'

  /* Parallel too few replacements */
  && rexReplace(['abc','def'], 'hello abc world def end', ['one']) == 'hello one world  end'

  /* Parallel too many replacements */
  && rexReplace(['abc','def'], 'hello abc world def end', ['one', 'two', 'three']) == 'hello one world two end'

  /* Limit */
  && rexReplace(R'abc', 'hello abc world abc end', 'xyz', ReplaceAll, 1, 1) == 'hello xyz world abc end'

  /* ReplaceOnce */
  && rexReplace(R'abc', 'hello abc world abc end', 'xyz', ReplaceOnce) == 'hello xyz world abc end'

  /* Index */
  && rexReplace(R'abc', 'hello abc world abc end', 'xyz', ReplaceAll, 12) == 'hello abc world xyz end'  

  /* Callback */
  && rexReplace(R'abc', 'hello abc world abc end', r, ReplaceAll) == 'hello ABC world ABC end'  

  /* Anonfunc */
  && rexReplace(R'abc', 'hello abc world abc end', {s: s.toUpper()}, ReplaceAll) == 'hello ABC world ABC end'  

  /* Callback in array of replacements */
  && rexReplace(['abc', 'def'], 'hello abc world def end', ['xyz', {s: s.toUpper()}], ReplaceAll) == 'hello xyz world DEF end'  

  /* Titlecase from docs */
  && rexReplace('%<(<alphanum>+)%>', 'the way to the postoffice', t, ReplaceAll) == 'The Way to the Postoffice'

  /* Back reference replacements */
  && rexReplace('-(<digit>+)', '100 -200 300 -400 500', '<red>(%1)</red>', ReplaceAll) 
  == '100 <red>(200)</red> 300 <red>(400)</red> 500';


}


