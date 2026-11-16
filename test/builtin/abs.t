#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   abs(val) returns the absolute value of an integer.
 */

_main(args)
{
    return abs(-3) == 3 && abs(3) == 3 && abs(0) == 0;
}
