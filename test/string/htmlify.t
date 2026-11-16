#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   htmlify(flags) escapes &, < and >. With HtmlifyTranslateWhitespace
 *   (or the individual flags) it also converts tabs to <tab>, newlines
 *   to <br>, and spaces to &nbsp; when they follow whitespace (a space,
 *   newline or tab), so runs of spaces and indentation survive HTML
 *   rendering. A leading space is left alone. Expected values were taken
 *   from the reference VM.
 */
_main(args)
{
    return '&<hello\t\n   there'.htmlify(HtmlifyTranslateWhitespace)
               == '&amp;&lt;hello<tab><br>&nbsp;&nbsp;&nbsp;there'
        && '&<b>'.htmlify() == '&amp;&lt;b&gt;'
        && 'a "q" \'x\''.htmlify() == 'a "q" \'x\''
        && '  a  b   c'.htmlify(HtmlifyTranslateSpaces)
               == ' &nbsp;a &nbsp;b &nbsp;&nbsp;c'
        && 'a\n  b'.htmlify(HtmlifyTranslateSpaces) == 'a\n&nbsp;&nbsp;b'
        && 'a\t  b'.htmlify(HtmlifyTranslateSpaces) == 'a\t&nbsp;&nbsp;b'
        && 'a\nb'.htmlify(HtmlifyTranslateNewlines) == 'a<br>b'
        && 'a\tb'.htmlify(HtmlifyTranslateTabs) == 'a<tab>b';
}
