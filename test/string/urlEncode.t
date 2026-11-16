#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   urlEncode() keeps ASCII letters, digits, - and _, turns spaces into
 *   +, and %-encodes everything else as UTF-8.
 */
_main(args)
{
    return 'a b,c-d_e'.urlEncode() == 'a+b%2Cc-d_e'
        && 'á'.urlEncode() == '%C3%A1'
        && 'A1/?&='.urlEncode() == 'A1%2F%3F%26%3D';
}
