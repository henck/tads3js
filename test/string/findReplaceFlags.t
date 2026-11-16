#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   findReplace flags: ReplaceIgnoreCase matches regardless of case;
 *   ReplaceFollowCase adapts the replacement's case to each match;
 *   ReplaceSerial applies a list of search terms one after the other,
 *   rescanning earlier replacements (parallel mode doesn't).
 */
_main(args)
{
    return 'Abc aBC abc'.findReplace('abc', 'x', ReplaceAll | ReplaceIgnoreCase) == 'x x x'
        && 'Abc aBC abc'.findReplace('abc', 'x', ReplaceOnce | ReplaceIgnoreCase) == 'x aBC abc'
        && 'Abc ABC abc'.findReplace('abc', 'xyz', ReplaceAll | ReplaceIgnoreCase | ReplaceFollowCase) == 'Xyz XYZ xyz'
        && 'ab'.findReplace(['a', 'b'], ['b', 'c']) == 'bc'
        && 'ab'.findReplace(['a', 'b'], ['b', 'c'], ReplaceAll | ReplaceSerial) == 'cc'
        && 'aa'.findReplace(['a', 'b'], ['b', 'c'], ReplaceOnce | ReplaceSerial) == 'ba';
}
