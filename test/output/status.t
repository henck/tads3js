#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   Text written in status mode (statusMode(StatModeStatus)) and with
 *   statusRight() goes to the status line, which a plain text console
 *   doesn't show.
 */

_main(args)
{
    tadsSay('A');
    statusMode(StatModeStatus);
    tadsSay('Status line text');
    statusMode(StatModeNormal);
    statusRight('Right');
    tadsSay('B\n');
    return true;
}
