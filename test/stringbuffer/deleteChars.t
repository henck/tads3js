#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   deleteChars(idx, len?) deletes len characters from idx (negative
 *   counts from the end), or to the end; returns the buffer.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local a = mk('abcdef'), b = mk('abcdef'), c = mk('abcdef'), d = mk('abcdef');
    local r = a.deleteChars(2);
    b.deleteChars(-2, 1);
    c.deleteChars(2, 0);
    d.deleteChars(2, 3);
    return r == a
        && toString(a) == 'a'
        && toString(b) == 'abcdf'
        && toString(c) == 'abcdef'
        && toString(d) == 'aef';
}
