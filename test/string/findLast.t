#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   findLast(target, index?) returns the index of the rightmost match
 *   starting before index (0 or omitted: the whole string; negative
 *   counts from the end), or nil.
 */
_main(args)
{
    return 'abcdef'.findLast('cd') == 3
        && 'abcdef'.findLast('g') == nil
        && 'abcabcabc'.findLast('c') == 9
        && 'abcabcabc'.findLast('c', 0) == 9
        && 'abcabcabc'.findLast('c', 9) == 6
        && 'abcabcabc'.findLast('c', -1) == 6
        && 'abc123'.findLast(R'%d') == 6
        && 'a1b22c333'.findLast(R'%d+') == 7;
}
