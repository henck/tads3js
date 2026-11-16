#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   sgn(val) returns -1, 0 or 1.
 */

_main(args)
{
    return sgn(-5) == -1 && sgn(0) == 0 && sgn(7) == 1;
}
