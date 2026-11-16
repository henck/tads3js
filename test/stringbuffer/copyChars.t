#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   copyChars(idx, str) overwrites characters from idx (negative counts
 *   from the end), extending the buffer if needed, and returns the
 *   buffer. (The header declares copyChars(txt, idx), but the reference
 *   VM takes the index first.)
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local a = mk('abcdef'), b = mk('abcdef'), c = mk('abcdef');
    local r = a.copyChars(2, 'YZ');
    b.copyChars(-2, 'YZ');
    c.copyChars(6, 'YZW');
    return r == a
        && toString(a) == 'aYZdef'
        && toString(b) == 'abcdYZ'
        && toString(c) == 'abcdeYZW';
}
