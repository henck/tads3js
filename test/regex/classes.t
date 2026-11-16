#charset "utf-8"
#include <tads.h>

/*
 *   Character classes (<Alpha>, <Upper>, <Lower>, <Digit>, <AlphaNum>,
 *   <Space>, <VSpace>, <Punct>, <Newline>), combinations, negation, and
 *   the % shortcuts. Word characters (%w) are alphanumeric only.
 */
_main(args)
{
    return rexSearch('<Alpha>+', '12abé3') == [3, 3, 'abé']
        && rexSearch('<ALPHA>+', '12ab3') == [3, 2, 'ab']
        && rexSearch('<Upper><Lower>*', 'abc Def ghi') == [5, 3, 'Def']
        && rexSearch('<Digit>+', 'ab123c') == [3, 3, '123']
        && rexSearch('<AlphaNum>+', '--a1b2--') == [3, 4, 'a1b2']
        && rexSearch('<Space>+', 'a \t b') == [2, 3, ' \t ']
        && rexSearch('<Space>', 'a\nb') == nil
        && rexSearch('<VSpace>', 'a\nb') == [2, 1, '\n']
        && rexSearch('<Punct>+', 'ab,.!cd') == [3, 3, ',.!']
        && rexSearch('<Newline>', 'a\nb') == [2, 1, '\n']
        && rexSearch('<^Digit>+', '12ab34') == [3, 2, 'ab']
        && rexSearch('<Digit|Upper>+', 'abC1Dxe') == [3, 3, 'C1D']
        && rexSearch('<a-f|w-z>+', 'mmafwzq') == [3, 4, 'afwz']
        && rexSearch('<^Space|Punct>+', ' ab, ') == [2, 2, 'ab']
        && rexSearch('%w+', '__ab12__') == [3, 4, 'ab12']
        && rexSearch('%W+', 'ab__cd') == [3, 2, '__']
        && rexSearch('%d+', 'ab12') == [3, 2, '12']
        && rexSearch('%D+', '12ab') == [3, 2, 'ab']
        && rexSearch('%s+', 'a  b') == [2, 2, '  ']
        && rexSearch('%S+', '  ab') == [3, 2, 'ab']
        && rexSearch('%v', 'a\nb') == [2, 1, '\n']
        && rexSearch('%V+', '\nab') == [2, 2, 'ab'];
}
