#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   makeList(val, repeatCount?) returns a list of repeatCount copies of
 *   val (default 1).
 */

_main(args)
{
    return makeList(1, 3) == [1, 1, 1]
        && makeList('a') == ['a']
        && makeList([1], 2) == [[1], [1]]
        && makeList(1, 0) == [];
}
