#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   HTML in text mode: unknown tags and comments are removed; <title>
 *   text is hidden; <img> shows its ALT text; <hr> is a line of dashes;
 *   <pre> keeps spaces and line breaks; <tab indent=n> and <tab
 *   multiple=n> add n spaces; <q> gives curly quotes, alternating double
 *   and single when nested.
 */
_main(args)
{
    tadsSay('Tag <b>bold</b> <i>it</i> <font color=red>red</font> <a href=x>link</a>.\n');
    tadsSay('unknown <foo bar=1>tag<!-- a <comment> -->.\n');
    tadsSay('a < b > c\n');
    tadsSay('<title>Title</title>after title\n');
    tadsSay('<img src=x alt=ALT>image\n');
    tadsSay('before<hr>after\n');
    tadsSay('x<pre>  a   b\n  c</pre>y\n');
    tadsSay('x <tab indent=10>y\n');
    tadsSay('xx<tab multiple=8>y\n');
    tadsSay('<q>a <q>b <q>c</q></q></q>\n');
    tadsSay('<center>c</center><div>d</div>\n');
    return true;
}
