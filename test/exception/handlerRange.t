#include <tads.h>

/*
 *   A handler only catches exceptions thrown from within its own
 *   protected code range. Here the first try block's catch must not
 *   catch the exception thrown in the second try block.
 */

class ErrA: object;

_main(args)
{
    local r = '';
    local guard = 0;

    try { r += 'a'; } catch(ErrA e) { r += 'X'; }

    // If the wrong handler runs, we come back here a second time.
    if(++guard > 1) return nil;

    try { throw new ErrA(); } catch(ErrA e) { r += 'b'; }

    return r == 'ab';
}
