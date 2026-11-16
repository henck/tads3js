#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   max(...) returns the largest argument.
 */

_main(args)
{
    return max(3, 9, 1) == 9 && max('a', 'c', 'b') == 'c' && max(5) == 5 && max(-1, -2) == -1;
}
