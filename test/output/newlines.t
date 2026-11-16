#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   Runs of \n are combined into one line break; \b and <p> end the line
 *   and add a blank line (and aren't combined); <br> always ends a line,
 *   even an empty one.
 */
_main(args)
{
    tadsSay('one\n\n\ntwo\n');
    tadsSay('x\by\n');
    tadsSay('\b\bafter two blank lines\n');
    tadsSay('x<p>y</p></p>z\n');
    tadsSay('x<br>y<br><br>z\n');
    tadsSay('x<br height=0>y<br height=2>z\n');
    tadsSay('a\tb\tc\tdd\teee\tf\n');
    tadsSay('\tindented\n');
    return true;
}
