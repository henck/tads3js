#include <tads.h>
#include <lookup.h>

/*
 *   applyAll(func) calls func(key, value) for each entry and replaces the
 *   value with the result. Keys are unchanged.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2, 'c' -> 3];
    t.applyAll({k, v: k + v});
    return t.getEntryCount() == 3
        && t['a'] == 'a1'
        && t['b'] == 'b2'
        && t['c'] == 'c3';
}
