#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   substr(idx, len?) returns a string of len characters from idx
 *   (negative counts from the end), or to the end. A length of 0 or less
 *   gives an empty string.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abcdef');
    return b.substr(3) == 'cdef'
        && b.substr(2, 3) == 'bcd'
        && b.substr(-2) == 'ef'
        && b.substr(2, 0) == ''
        && b.substr(2, -1) == ''
        && dataType(b.substr(1)) == TypeSString;
}
