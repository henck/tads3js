#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   b[i] returns the character at i as a one-character string;
 *   b[i] = x replaces it with the first character of a string, or a
 *   character code. Negative indices count from the end when assigning.
 *   (The manual also allows them when reading, but the reference VM
 *   reports "index out of range"; not tested.)
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abcdef');
    local c3 = b[3], c1 = b[1], c6 = b[6];
    b[2] = 'B';
    b[3] = 67;
    b[-1] = 'Fx';
    return c3 == 'c' && c1 == 'a' && c6 == 'f'
        && toString(b) == 'aBCdeF';
}
