#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   append(str) adds text at the end and returns the buffer itself.
 *   Non-strings are converted: integers and true become text; nil adds
 *   nothing.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = new StringBuffer();
    local r = b.append('abc');
    b.append(5).append(true).append(nil).append('');
    return r == b
        && toString(b) == 'abc5true'
        && b.length() == 8;
}
