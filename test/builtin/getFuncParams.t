#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   getFuncParams(func) returns [required, optional, varargs?].
 */

f(a, b) { }
g(a, ...) { }
h() { }

_main(args)
{
    return getFuncParams(f) == [2, 0, nil]
        && getFuncParams(g) == [1, 0, true]
        && getFuncParams(h) == [0, 0, nil]
        && getFuncParams({x, y: x}) == [2, 0, nil];
}
