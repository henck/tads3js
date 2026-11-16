#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   insert(idx, str) inserts text before the character at idx (negative
 *   counts from the end; past the end appends), converting non-strings,
 *   and returns the buffer. (The manual and header say insert(str, idx),
 *   but the reference VM takes the index first.)
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local a = mk('abcdef'), b = mk('abcdef'), c = mk('abcdef'), d = mk('abcdef');
    local r = a.insert(2, 'X');
    b.insert(99, 'X');
    c.insert(-1, 'X');
    d.insert(1, 7);
    return r == a
        && toString(a) == 'aXbcdef'
        && toString(b) == 'abcdefX'
        && toString(c) == 'abcdeXf'
        && toString(d) == '7abcdef';
}
