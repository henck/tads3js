#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   specialsToText() converts TADS formatting codes to plain text:
 *   \n (unless at the start of a line), \b, \^, \v, quoted spaces,
 *   <q> quotes, <p>, <br height=n>, removed tags and HTML entities.
 */
_main(args)
{
    return 'a\nb'.specialsToText() == 'a\nb'
        && '\nabc'.specialsToText() == 'abc'
        && 'a\bb'.specialsToText() == 'a\n\nb'
        && '\^hello'.specialsToText() == 'Hello'
        && '\vHELLO'.specialsToText() == 'hELLO'
        && 'a\ b'.specialsToText() == 'a b'
        && '<q>hi <q>there</q></q>'.specialsToText() == '"hi \'there\'"'
        && 'a<p>b'.specialsToText() == 'a\n\nb'
        && '<b>bold</b>'.specialsToText() == 'bold'
        && '&lt;&amp;&gt;'.specialsToText() == '<&>'
        && 'a<br height=2>b'.specialsToText() == 'a\n\n\nb'
        && 'a<br>b'.specialsToText() == 'a\nb'
        && '<br>b'.specialsToText() == '\nb'
        && 'a<div>b</div>c'.specialsToText() == 'a\nb\nc'
        && 'x&nbsp;y&foo;z'.specialsToText() == 'x yfooz'
        && 'a\n\nb'.specialsToText() == 'a\nb'
        && '\^<b>x'.specialsToText() == 'X'
        && 'a\tb'.specialsToText() == 'a\tb';
}
