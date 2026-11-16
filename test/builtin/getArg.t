#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   getArg(idx) returns the idx'th argument of the current function;
 *   out of range is "bad value for built-in function" (2306).
 */

f(a, b) { return getArg(2); }
g(x, ...) { return [getArg(1), getArg(argcount)]; }
h(a) { return getArg(2); }

_main(args)
{
    return f(1, 2) == 2
        && g(1, 2, 3) == [1, 3]
        && errnoOf({: h(1) }) == 2306;
}
