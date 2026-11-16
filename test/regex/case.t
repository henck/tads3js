#charset "utf-8"
#include <tads.h>

/*
 *   <NoCase> makes the whole match case-insensitive (the last of
 *   <Case>/<NoCase> wins). Case folding can expand a character: a pattern
 *   'ß' matches 'ß' or 'ss', and a subject 'ß' matches contiguous
 *   literal 'ss' in the pattern, but not '(s)(s)', 's+' or '..'.
 */
_main(args)
{
    return rexSearch('<nocase>abc', 'xABc') == [2, 3, 'ABc']
        && rexSearch('abc<NoCase>', 'xABc') == [2, 3, 'ABc']
        && rexSearch('<nocase><case>abc', 'ABC') == nil
        && rexSearch('abc', 'ABC') == nil
        && rexSearch('<nocase>.*ß', 'weiß') == [1, 4, 'weiß']
        && rexSearch('<nocase>.*ß', 'WEISS') == [1, 5, 'WEISS']
        && rexSearch('<nocase>ss', 'ß') == [1, 1, 'ß']
        && rexSearch('<nocase>s+', 'ß') == nil
        && rexSearch('<nocase>(s)(s)', 'ß') == nil
        && rexSearch('<nocase>..', 'ß') == nil
        && rexSearch('<nocase>É', 'élan') == [1, 1, 'é'];
}
