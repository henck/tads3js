#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   Runs of spaces are combined, and spaces are trimmed at the start and
 *   end of a line. Quoted spaces (\ ) and typographical spaces aren't
 *   combined, and replace adjacent ordinary spaces; &nbsp; is shown as a
 *   space but isn't combined or trimmed. In text mode, an en space takes
 *   two columns and an em space three.
 */
_main(args)
{
    tadsSay('one   two    three\n');
    tadsSay('   leading and trailing   \n');
    tadsSay('quoted:\ \ \ x\n');
    tadsSay('\ \ indented\n');
    tadsSay('&nbsp;a&ensp;b&emsp;c&thinsp;d\n');
    tadsSay('x&ensp;&ensp;  &emsp; y\n');
    tadsSay('part one');
    tadsSay(' part two\n');
    tadsSay('a&nbsp;&nbsp;&nbsp;b\n');
    tadsSay('[a\ b] [a \ b] [a\  b] [a \  b]\n');
    tadsSay('[a&ensp; b] [a &ensp;b]\n');
    tadsSay('[a \tb] [a\t b] [a <tab indent=2> b]\n');
    return true;
}
