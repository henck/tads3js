#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   Comparison operators treat a StringBuffer as the string it holds.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    local b = mk('abcdef');
    return b == 'abcdef'
        && b != 'x'
        && b < 'b'
        && b > 'abc'
        && b == mk('abcdef')
        && b <= 'abcdef'
        && b >= 'abcdef';
}
