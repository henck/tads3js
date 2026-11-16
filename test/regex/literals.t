#charset "utf-8"
#include <tads.h>

/*
 *   Ordinary characters match themselves; % quotes a special character;
 *   named characters like <period> and single-character classes like
 *   <x> match that character; } is an ordinary character.
 */
_main(args)
{
    return rexSearch('abc', 'xxabcxx') == [3, 3, 'abc']
        && rexSearch('abc', 'xxabxx') == nil
        && rexSearch('a%.c', 'abc a.c') == [5, 3, 'a.c']
        && rexSearch('a%+', 'aa+') == [2, 2, 'a+']
        && rexSearch('%%', '50%') == [3, 1, '%']
        && rexSearch('%(%)', 'f()') == [2, 2, '()']
        && rexSearch('<period>', 'a.b') == [2, 1, '.']
        && rexSearch('<langle><rangle>', 'a<>b') == [2, 2, '<>']
        && rexSearch('<lparen|rparen>+', 'f(x)') == [2, 1, '(']
        && rexSearch('<x>y', 'axy') == [2, 2, 'xy']
        && rexSearch('<tab>', 'a\tb') == [2, 1, '\t']
        && rexSearch('}', 'a}') == [2, 1, '}']
        && rexSearch('a b', 'xa b') == [2, 3, 'a b'];
}
