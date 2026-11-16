#include <tads.h>
#include <lookup.h>

/*
 *   isKeyPresent(key) returns true if the key is present, nil if not -
 *   including when the key is present with a nil value.
 */
_main(args)
{
    local t = ['a' -> 1, 'b' -> nil, * -> 'dflt'];
    return t.isKeyPresent('a') == true
        && t.isKeyPresent('b') == true
        && t['b'] == nil                // present with nil value: not the default
        && t.isKeyPresent('c') == nil;
}
