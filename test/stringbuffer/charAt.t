#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   charAt(idx) returns the character code at idx (negative counts
 *   from the end).
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abcdef');
    return b.charAt(1) == 97
        && b.charAt(6) == 102
        && b.charAt(-1) == 102
        && b.charAt(-6) == 97;
}
