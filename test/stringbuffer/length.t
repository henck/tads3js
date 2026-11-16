#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   length() returns the number of characters.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abc');
    local n1 = b.length();
    b.append('de');
    return n1 == 3 && b.length() == 5 && new StringBuffer().length() == 0;
}
