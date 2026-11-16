#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   specialsToHtml() converts TADS formatting codes to standard HTML:
 *   \n to <BR> (unless at the start of a line), \b, \^, \v, and <q>
 *   quotes to typographic entities; other tags are left alone. (The
 *   manual writes <BR>; the reference VM produces lower-case <br>.)
 */
_main(args)
{
    return 'a\nb'.specialsToHtml() == 'a<br>b'
        && '\nabc'.specialsToHtml() == 'abc'
        && 'a\bb'.specialsToHtml() == 'a<br><br>b'
        && '\^hello'.specialsToHtml() == 'Hello'
        && '\vHELLO'.specialsToHtml() == 'hELLO'
        && '<q>hi</q>'.specialsToHtml() == '&ldquo;hi&rdquo;'
        && '<b>bold</b>'.specialsToHtml() == '<b>bold</b>'
        && 'a\ \ b'.specialsToHtml() == 'a&nbsp; b'
        && 'a \ b'.specialsToHtml() == 'a b'
        && 'a<br height=2>b'.specialsToHtml() == 'a<br><br><br>b'
        && 'a<p>\nb'.specialsToHtml() == 'a<p>b'
        && 'x &amp;'.specialsToHtml() == 'x &amp;'
        && 'a\tb'.specialsToHtml() == 'a&nbsp; b';
}
