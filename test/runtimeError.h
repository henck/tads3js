/*
 *   Shared definitions for tests of run-time errors.
 *
 *   The test build excludes the library's _main.t, which normally defines
 *   RuntimeError. This is a minimal stand-in: like the real one, it's
 *   exported so the VM uses it for run-time errors, and the VM sets its
 *   exported exceptionMessage property.
 */
class Exception: object;

class RuntimeError: Exception
    construct(errno, ...) { errno_ = errno; }
    errno_ = 0
    exceptionMessage = nil
;
export RuntimeError;
export exceptionMessage;

/*
 *   Call func and return the number of the run-time error it raises, or
 *   nil if it doesn't raise one.
 */
errnoOf(func)
{
    try { func(); }
    catch(RuntimeError e) { return e.errno_; }
    return nil;
}
