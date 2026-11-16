#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   min(...) returns the smallest argument.
 */

_main(args)
{
    return min(3, 9, 1) == 1 && min('a', 'c', 'b') == 'a' && min(5) == 5 && min(-1, -2) == -2;
}
