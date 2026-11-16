#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   Character entities: named (case-sensitive), decimal and hex; an
 *   unknown name is shown as written, and the semicolon is optional.
 */
_main(args)
{
    tadsSay('&amp; &lt; &gt; &quot; &eacute; &copy; &mdash; &ndash; &lsquo;&rsquo;&ldquo;&rdquo;\n');
    tadsSay('&#65;&#x42;&#x263A;\n');
    tadsSay('&bogus; &AMP; &amp &ampx\n');
    tadsSay('&endash; &emdash; &trade;\n');
    return true;
}
