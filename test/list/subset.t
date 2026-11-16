#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   subset(func) returns the elements for which func returns neither
 *   nil nor 0; the original is unchanged.
 */
_main(args)
{
    local x = [5, 10, 15, 20];
    return x.subset({e: e > 10}) == [15, 20]
        && x.subset({e: e == 10 ? 1 : 0}) == [10]
        && x.subset({e: nil}) == []
        && x == [5, 10, 15, 20];
}
