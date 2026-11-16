#include <tads.h>

/*
 *   'finally' runs on normal exit and when an exception passes
 *   through; the exception then continues to the next enclosing
 *   handler, whether that is in the same function or a caller.
 *
 *   (The log is a fresh instance rather than a static object: the
 *   compiler runs _main during preinit, so changes to static objects
 *   would already be baked into the image.)
 */

class ErrA: object;

class Log: object
    s = ''
;

inner(log)
{
    try { throw new ErrA(); } finally { log.s += 'f'; }
}

_main(args)
{
    local log = new Log();
    local guard = 0;

    // finally runs, then the exception reaches the caller's catch.
    try { inner(log); } catch(ErrA e) { log.s += 'c'; }
    if(++guard > 1) return nil;

    // try/finally nested in try/catch within the same function.
    try {
        try { throw new ErrA(); } finally { log.s += 'g'; }
    } catch(ErrA e) {
        log.s += 'd';
    }
    if(++guard > 2) return nil;

    // finally on normal exit.
    try { log.s += 'n'; } finally { log.s += 'h'; }

    return log.s == 'fcgdnh';
}
