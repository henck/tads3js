#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   cdr() returns the list without its first element, or nil for an
 *   empty list.
 */
_main(args)
{
    return [1, 2, 3, 4, 5].cdr() == [2, 3, 4, 5]
        && [1].cdr() == []
        && [].cdr() == nil;
}
