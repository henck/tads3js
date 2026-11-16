#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   new StringBuffer(), new StringBuffer(size) and
 *   new StringBuffer(size, increment) all create an empty buffer.
 */
mk(s) { local b = new StringBuffer(); b.append(s); return b; }

_main(args)
{
    return new StringBuffer().length() == 0
        && new StringBuffer(1000).length() == 0
        && new StringBuffer(1000, 500).length() == 0
        && toString(new StringBuffer()) == '';
}
