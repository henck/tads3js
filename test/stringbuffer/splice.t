#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   splice(idx, len, str) replaces len characters at idx (negative
 *   counts from the end) with str, converting non-strings; returns the
 *   buffer.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local a = mk('abcdef'), b = mk('abcdef'), c = mk('abcdef');
    local r = a.splice(2, 2, 'XYZ');
    b.splice(-2, 1, 9);
    c.splice(3, 0, '-');
    return r == a
        && toString(a) == 'aXYZdef'
        && toString(b) == 'abcd9f'
        && toString(c) == 'ab-cdef';
}
