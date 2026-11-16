#include <tads.h>
#include <lookup.h>

/*
 *   nthKey(n) returns the key at index n of keysToList(); nthVal(n) the
 *   value for that same entry.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2, 'c' -> 3];
    local keys = t.keysToList();
    for(local i = 1; i <= t.getEntryCount(); i++) {
        if(t.nthKey(i) != keys[i]) return nil;
        if(t.nthVal(i) != t[keys[i]]) return nil;
    }
    return true;
}
