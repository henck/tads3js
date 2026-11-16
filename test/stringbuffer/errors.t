#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   Indexing or charAt() out of range is "index out of range" (2015);
 *   + can't be used with a StringBuffer (2003).
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abcdef');
    return errnoOf({: b.charAt(50) }) == 2015
        && errnoOf({: b[50] }) == 2015
        && errnoOf({: b[0] }) == 2015
        && errnoOf({: b + 'x' }) == 2003;
}
