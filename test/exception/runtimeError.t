#include <tads.h>
#include <vector.h>
#include "../runtimeError.h"

/*
 *   Run-time errors are thrown as instances of the exported RuntimeError
 *   class, constructed with the error number, with exceptionMessage set
 *   to the error message. They can be caught like any exception: by a
 *   superclass, through native code (callbacks), and finally blocks run.
 */

f(a) { return a; }

class Log: object s = '';

_main(args)
{
    local l = [1, 2], z = 0, n = nil, s = 'a', v = new Vector([1]);
    local fp = f;

    // The exception object and its message.
    local msg = nil;
    try { local x = l[5]; } catch(RuntimeError e) { msg = e.exceptionMessage; }

    // Caught by a superclass.
    local bySuper = nil;
    try { local x = 1 / z; } catch(Exception e) { bySuper = e.errno_; }

    // Thrown inside a callback run by native code.
    local inCallback = errnoOf({: [1, 2].forEach({x: x / z}) });

    // finally runs, and the error continues outward.
    local log = new Log();
    try { try { local x = n.foo; } finally { log.s += 'f'; } } catch(RuntimeError e) { log.s += 'c'; }

    return msg == 'index out of range'
        && bySuper == 2008                          // division by zero
        && inCallback == 2008
        && log.s == 'fc'
        && errnoOf({: l[5] }) == 2015               // index out of range
        && errnoOf({: v[3] }) == 2015
        && errnoOf({: s - 1 }) == 2007              // invalid datatypes for subtraction
        && errnoOf({: n.foo }) == 2203              // nil object reference
        && errnoOf({: fp(1, 2) }) == 2201           // wrong number of arguments
        && errnoOf({: s.substr('x') }) == 2005      // integer value required
        && errnoOf({: l[1] }) == nil;
}
