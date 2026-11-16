#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   find(target, index?) returns the index of the first match of a
 *   string or RexPattern at or after index (negative counts from the
 *   end), or nil.
 */
_main(args)
{
    return 'abcdef'.find('cd') == 3
        && 'abcdef'.find('g') == nil
        && 'abcdef'.find('c', 3) == 3
        && 'abcdef'.find('c', 4) == nil
        && 'abcabcabc'.find('c', 4) == 6
        && 'abcabcabc'.find('c', 7) == 9
        && 'abcabcabc'.find('a', -3) == 7
        && 'abcdef123456'.find(R'%d+') == 7
        && 'abcdef'.find('') == 1;
}
