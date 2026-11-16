#include "grammar.h"

/*
 *   With a StringComparator in the dictionary, literals and parts of
 *   speech are matched with it (here: case-insensitive, truncated to 4
 *   characters), and tokenMatchList gives its match values.
 */

o1: object noun = 'lantern';

grammar cmd(a): 'examine' noun->n_ : object;
grammar cmd(b): 'look' 'at' noun->n_ : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    gDict.setComparator(new StringComparator(4, nil, []));
    parse(cmd, 'examine lantern');
    parse(cmd, 'EXAM lant');
    parse(cmd, 'examined lanterns');
    parse(cmd, 'Look AT lantern');
    parse(cmd, 'exa lantern');
    return true;
}
