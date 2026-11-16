#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   inputLine() reads a line of input (nil at the end of the input). The
 *   text displayed before it is shown as it is, and the input ends the
 *   line.
 */

_main(args)
{
    tadsSay('Prompt&gt;');
    local a = inputLine();
    tadsSay('got [' + a + ']\n');
    tadsSay('\n&gt;');
    local b = inputLine();
    tadsSay('got [' + b + '] after\n');
    tadsSay('trailing space ');
    local c = inputLine();
    tadsSay('[' + c + ']');
    local d = inputLine();
    tadsSay('[' + d + ']\n');
    local e = inputLine();
    tadsSay('[' + (e == nil ? 'nil' : e) + ']\n');
    return true;
}
