#charset "utf-8"
#include <tads.h>

/*
 *   (?= ) and (?! ) look ahead, (?<= ) and (?<! ) look back, without
 *   consuming text. Look-back may have variable length.
 */
_main(args)
{
    return 'the cat of tom'.findAll(R'(?!%<(the|of)%>)%<%w+%>') == ['cat', 'tom']
        && 'One two. Three four! Five'.findAll(R'(?<=^|[.!?]<space>+)%<%w+%>') == ['One', 'Three', 'Five']
        && rexSearch('foo(?=bar)', 'foobaz foobar') == [8, 3, 'foo']
        && rexSearch('foo(?!bar)', 'foobar foobaz') == [8, 3, 'foo']
        && rexSearch('(?<!x)y', 'xy ay') == [5, 1, 'y']
        && rexSearch('(?<=ab)c', 'xc abc') == [6, 1, 'c'];
}
