#include <tads.h>

/*
 *   The first catch clause whose class matches the exception is used;
 *   a subclass is caught by a catch clause for its superclass.
 */

class ErrA: object;
class ErrB: object;
class ErrB2: ErrB;

_main(args)
{
    local r = '';
    try { throw new ErrB(); } catch(ErrA e) { r += 'x'; } catch(ErrB e) { r += 'b'; }
    try { throw new ErrB2(); } catch(ErrA e) { r += 'x'; } catch(ErrB e) { r += 'c'; }
    try { throw new ErrA(); } catch(ErrA e) { r += 'a'; } catch(ErrB e) { r += 'x'; }
    return r == 'bca';
}
