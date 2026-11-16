#include <tads.h>
#include <vector.h>

/*
 *   applyAll(func) replaces each element with func(element), in
 *   place, and returns self.
 */
_main(args)
{
    local x = new Vector([1, 2, 3]);
    local r = x.applyAll({e: e * 2});
    r[1] = 0;                           // r is x itself
    return x.toList() == [0, 4, 6];
}
