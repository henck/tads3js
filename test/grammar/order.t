#include "grammar.h"

/*
 *   The order of the matches follows the reference VM's parsing
 *   algorithm.
 */

o1: object noun = 'red' 'box' 'key' adjective = 'red' 'big' 'box';

grammar cmd(a): 'put' np->d_ 'in' np->i_ : object;
grammar cmd(b): 'put' np->d_ * : object;
grammar cmd(c): verbish->v_ np->d_ : object;
grammar verbish(1): 'put' : object;
grammar verbish(2): 'put' 'in' : object;
grammar np(n): noun->n_ : object;
grammar np(a): adjective->a_ np->np_ : object;
grammar np(l): np->a_ 'and' np->b_ : object;
grammar np(l2): np->a_ ',' np->b_ : object;
grammar np(p): np->a_ 'of' np->b_ : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    cfg.long = nil;
    parse(cmd, 'put red box in box');
    parse(cmd, 'put big red box');
    parse(cmd, 'put in red');
    parse(cmd, 'put key and box and red , key');
    parse(cmd, 'put key of box and red');
    parse(np, 'red red box');
    return true;
}
