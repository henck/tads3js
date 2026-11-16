#include <tads.h>

/*
 *   Exceptions must propagate through native (intrinsic) code that
 *   calls back into byte code: callbacks passed to forEach/mapAll,
 *   and constructors run by 'new'.
 */

class ErrA: object;

thrower(x) { if(x == 2) throw new ErrA(); }

safe(x)
{
    try { thrower(x); } catch(ErrA e) { return 'c'; }
    return '';
}

class Boom: object
    construct() { throw new ErrA(); }
;

_main(args)
{
    local r = '';

    // Thrown in a callback, caught outside the native forEach.
    try { [1,2,3].forEach({x: thrower(x)}); r += 'x'; } catch(ErrA e) { r += 'a'; }

    // Thrown in a constructor, caught by the code doing 'new'.
    try { local b = new Boom(); r += 'x'; } catch(ErrA e) { r += 'b'; }

    // Thrown and caught entirely inside the callback.
    r += [1,2,3].mapAll({x: safe(x)}).join('');

    return r == 'abc';
}
