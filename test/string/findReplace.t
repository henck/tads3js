#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   findReplace(old, new, flags?, index?, limit?): string or pattern
 *   (or lists of them), string or function replacements, ReplaceOnce,
 *   limit, start index, %n group references, parallel list mode.
 */
_main(args)
{
    local r = function(s) { return s.toUpper(); };
    local t = function(s, idx)
    {
       /* don't capitalize certain small words, except at the beginning */
       if (idx > 1 && ['a', 'an', 'of', 'the', 'to'].indexOf(s.toLower()) != nil)
           return s;
       /* capitalize the first letter */
       return s.substr(1, 1).toTitleCase() + s.substr(2);
    };
    return 'hello abc world abc end'.findReplace('abc', 'xyz') == 'hello xyz world xyz end'
        && 'hello abc world def end'.findReplace(['abc', 'def'], 'xyz') == 'hello xyz world xyz end'
        && 'hello abc world def end'.findReplace(['abc', 'def'], ['one', 'two']) == 'hello one world two end'
        && 'hello abc world def end'.findReplace(['abc', 'def'], ['one']) == 'hello one world  end'
        && 'hello abc world def end'.findReplace(['abc', 'def'], ['one', 'two', 'three']) == 'hello one world two end'
        && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceAll, 1, 1) == 'hello xyz world abc end'
        && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceAll, 1, 0) == 'hello abc world abc end'
        && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceOnce) == 'hello xyz world abc end'
        && 'hello abc world abc end'.findReplace(R'abc', 'xyz', ReplaceAll, 12) == 'hello abc world xyz end'
        && 'hello abc world abc end'.findReplace('abc', 'xyz', ReplaceAll, -3) == 'hello abc world abc end'
        && 'hello abc world abc end'.findReplace('abc', 'xyz', ReplaceAll, -7) == 'hello abc world xyz end'
        && 'hello abc world abc end'.findReplace(R'abc', r, ReplaceAll) == 'hello ABC world ABC end'
        && 'hello abc world abc end'.findReplace(R'abc', {s: s.toUpper()}, ReplaceAll) == 'hello ABC world ABC end'
        && 'ab ab'.findReplace('ab', {m, i: toString(i)}) == '1 4'
        && 'ab'.findReplace('ab', {m, i, o: o + '!'}) == 'ab!'
        && 'ab'.findReplace('ab', {m: nil}) == ''
        && 'hello abc world def end'.findReplace(['abc', 'def'], ['xyz', {s: s.toUpper()}], ReplaceAll) == 'hello xyz world DEF end'
        && 'the way to the postoffice'.findReplace(R'%<(<alphanum>+)%>', t, ReplaceAll) == 'The Way to the Postoffice'
        && '100 -200 300 -400 500'.findReplace(R'-(<digit>+)', '<red>(%1)</red>', ReplaceAll)
               == '100 <red>(200)</red> 300 <red>(400)</red> 500'
        && 'a%b'.findReplace('%', '%%') == 'a%%b'
        && 'ab'.findReplace(R'b', '[%*]') == 'a[b]';
}
