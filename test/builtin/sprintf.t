#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   sprintf(format, ...) formats values: flags (- + space , _x # [n]),
 *   width, precision, and types b c d e E f g G o r R s u x X %. Expected
 *   values are from the reference VM (which, contrary to the manual, pads
 *   %#5d with spaces and gives %#x a 0x prefix).
 */

_main(args)
{
    local n = nil, t = true;
    return sprintf('i=%d, j=%d, k=%d', 99, 23, 145) == 'i=99, j=23, k=145'
        && sprintf('%5d', 42) == '   42'
        && sprintf('%-5d|', 42) == '42   |'
        && sprintf('%05d', 42) == '00042'
        && sprintf('%+d', 42) == '+42'
        && sprintf('% d', 42) == ' 42'
        && sprintf('%+5d', -3) == '   -3'
        && sprintf('%,d', 1234567) == '1,234,567'
        && sprintf('%_*8x', 123) == '******7b'
        && sprintf('%x %X %o %b', 255, 255, 8, 5) == 'ff FF 10 101'
        && sprintf('%#8x', 255) == '    0xff'
        && sprintf('%#5d', 42) == '   42'
        && sprintf('%.8d', 1234) == '00001234'
        && sprintf('%8.3d', 7) == '     007'
        && sprintf('%c%c', 65, 'xyz') == 'Ax'
        && sprintf('%s|%.2s|%5s|%-5s|', 'abc', 'abcdef', 'ab', 'ab') == 'abc|ab|   ab|ab   |'
        && sprintf('%r %R %r', 1999, 4, 0) == 'mcmxcix IV 0'
        && sprintf('%u %x', -1, -1) == '4294967295 ffffffff'
        && sprintf('%d', -42) == '-42'
        && sprintf('%.2f %f', 3, 3) == '3.00 3.000000'
        && sprintf('%e %E', 12345, 12345) == '1.234500e+004 1.234500E+004'
        && sprintf('%g %g', 12345, 1234567) == '12345 1.23457e+006'
        && sprintf('%q', 1) == '%q'
        && sprintf('100%%') == '100%'
        && sprintf('%[2]d %[1]d', 100, 200) == '200 100'
        && sprintf('%d %d %d', '17', t, n) == '17 1 0'
        && sprintf('%s|%s', 5, n) == '5|';
}
