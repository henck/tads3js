#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   Lines are wrapped at word boundaries to fit 79 columns: after spaces,
 *   after a hyphen (but not between two hyphens), at &zwsp; and &shy;, not
 *   at &nbsp; or next to &zwnbsp;. A word too long for a line is broken
 *   at the margin.
 */
_main(args)
{
    tadsSay('aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd eeeeeeeeee ffffffffff gggggggggg hhhhhhhhhh iiiiiiiiii\n');
    tadsSay('aaaaaaaaaa-bbbbbbbbbb-cccccccccc-dddddddddd-eeeeeeeeee-ffffffffff-gggggggggg-hhhhhhhhhh-iiiiiiiiii\n');
    tadsSay('aaaaaaaaaa--bbbbbbbbbb--cccccccccc--dddddddddd--eeeeeeeeee--ffffffffff--gggggggggg--hhhhhhhhhh\n');
    tadsSay('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n');
    tadsSay('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx yy\n');
    tadsSay('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx yy\n');
    tadsSay('aaaa&nbsp;bbbb&nbsp;cccc&nbsp;dddd&nbsp;eeee&nbsp;ffff&nbsp;gggg&nbsp;hhhh&nbsp;iiii&nbsp;jjjj&nbsp;kkkk&nbsp;llll&nbsp;mmmm&nbsp;nnnn&nbsp;oooo&nbsp;ppppp qq\n');
    tadsSay('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&zwsp;bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n');
    tadsSay('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&shy;bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n');
    tadsSay('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb&zwnbsp; cccc\n');
    tadsSay('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb&zwnbsp;cccc\n');
    tadsSay('<wrap char>aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd eeeeeeeeee ffffffffff gggggggggg hhhhhhhhhh<wrap word>\n');
    return true;
}
