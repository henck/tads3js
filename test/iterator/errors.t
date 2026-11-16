#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   getCurKey()/getCurVal() before the first getNext(), and getNext()
 *   past the end, are errors. The manual says "index out of range"/"out of
 *   bounds", but the reference VM reports "value is out of range" (2027).
 *   After the end, getCurVal() still returns the last value.
 */
_main(args)
{
    local it = [1, 2].createIterator();
    local k0 = errnoOf({: it.getCurKey() });
    local v0 = errnoOf({: it.getCurVal() });
    it.getNext();
    it.getNext();
    local past = errnoOf({: it.getNext() });
    return k0 == 2027 && v0 == 2027 && past == 2027
        && it.getCurVal() == 2
        && it.getCurKey() == 2;
}
