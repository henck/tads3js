#charset "utf-8"
#include <tads.h>

/*
 *   Parenthesized groups are numbered by their opening parenthesis;
 *   rexGroup(n) gives [index, length, text], or nil for a group that
 *   didn't take part. When ambiguous, earlier groups get the longest
 *   text. (?: ) doesn't capture.
 */
_main(args)
{
    local a = rexSearch('(%w+) (%w+)', 'hello big world');
    local a1 = rexGroup(1), a2 = rexGroup(2), a3 = rexGroup(3);
    local b = rexSearch('(a)|(b)', 'xb');
    local b1 = rexGroup(1), b2 = rexGroup(2);
    local c = rexSearch('say (.*) to (.*)', 'say time to go to Bob');
    local c1 = rexGroup(1), c2 = rexGroup(2);
    local d = rexSearch('(?:ab)+(c)', 'ababc');
    local d1 = rexGroup(1);
    local e = rexSearch('((a)(b))c', 'abc');
    local e1 = rexGroup(1), e2 = rexGroup(2), e3 = rexGroup(3);
    return a == [1, 9, 'hello big']
        && a1 == [1, 5, 'hello'] && a2 == [7, 3, 'big'] && a3 == nil
        && b == [2, 1, 'b'] && b1 == nil && b2 == [2, 1, 'b']
        && c1[3] == 'time to go' && c2[3] == 'Bob'
        && d == [1, 5, 'ababc'] && d1 == [5, 1, 'c']
        && e1[3] == 'ab' && e2[3] == 'a' && e3[3] == 'b';
}
