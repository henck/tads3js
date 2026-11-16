#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   String + appends the string form of a value (nil adds nothing);
 *   == compares text; < and > compare by Unicode code point.
 */
_main(args)
{
    local a = 'abc', n = nil;
    return a + 'def' == 'abcdef'
        && a + 1 == 'abc1'
        && a + n == 'abc'
        && a + true == 'abctrue'
        && a == 'ab' + 'c'
        && a != 'ABC'
        && a < 'abd'
        && 'B' < 'a'
        && 'b' > 'abc'
        && '' < 'a';
}
