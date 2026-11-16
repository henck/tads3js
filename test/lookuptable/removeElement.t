#include <tads.h>
#include <lookup.h>

/*
 *   removeElement(key) removes the entry and returns its value, or makes
 *   no change and returns nil if the key isn't present.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> 2];
    local r1 = t.removeElement('a');
    local r2 = t.removeElement('zzz');
    return r1 == 1
        && r2 == nil
        && t.getEntryCount() == 1
        && t.isKeyPresent('a') == nil
        && t['b'] == 2;
}
