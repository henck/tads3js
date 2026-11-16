#include "grammar.h"

/*
 *   Alternatives with a badness rating are only tried if there's no match
 *   without them, starting with the lowest badness. (A '*' given badness
 *   is applied to its own alternative only.)
 */

o1: object noun = 'box' adjective = 'red';

grammar cmd(a): 'put' noun->n_ : object;
grammar cmd(c): [badness 10] * | 'jump' : object;
grammar cmd(e): [badness 20] 'put' 'in' 'box' : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    cfg.long = nil;
    parse(cmd, 'put box');
    parse(cmd, 'put red');
    parse(cmd, 'put in box');
    parse(cmd, 'jump');
    parse(cmd, 'zork');
    return true;
}
