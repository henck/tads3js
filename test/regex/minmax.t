#charset "utf-8"
#include <tads.h>

/*
 *   <Min> picks the shortest overall match (<Max>, the default, the
 *   longest); either way earlier groups get the longest text.
 */
_main(args)
{
    local a = rexSearch('<Min>say (.*) to (.*)', 'say time to go to Bob');
    local a1 = rexGroup(1), a2 = rexGroup(2);
    local b = rexSearch('<Min>tell (.*) to<space>', 'tell Bob to go to the store');
    local b1 = rexGroup(1);
    local c = rexSearch('tell%>(.*?)%<to%>(.*)', 'tell him to go to the store');
    local c1 = rexGroup(1);
    return a1[3] == 'time' && a2[3] == ''
        && b1[3] == 'Bob'
        && c1[3] == ' him '
        && rexSearch('<Min>a+', 'aaa') == [1, 1, 'a']
        && rexSearch('<Max>a+', 'aaa') == [1, 3, 'aaa'];
}
