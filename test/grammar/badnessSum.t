#include "grammar.h"

/*
 *   A match's badness is the total of the badness of the alternatives in
 *   its tree, and only the matches with the lowest total are returned.
 */
o1: object noun = 'bob';

grammar cmd(a): [badness 50] 'tell' np->n_ : object;
grammar cmd(b): [badness 50] 'tell' np->n_ rest->r_ : object;
grammar np(n): noun->n_ : object;
grammar np(any): [badness 10] tokWord->w_ rest->r_ : object;
grammar rest(w): tokWord->w_ : object;
grammar rest(more): tokWord->w_ rest->r_ : object;
grammar opt(a): [badness 5] 'x' : object;
grammar opt(b): [badness 3] 'x' : object;
grammar opt(c): [badness 2] 'x' optb->o_ : object;
grammar optb(a): [badness 1] : object;
grammar optb(b): [badness 4] : object;

_main(args)
{
    if(t3GetVMPreinitMode())
        return true;
    cfg.long = nil;
    parse(cmd, 'tell bob i quit');
    parse(cmd, 'tell zork i quit');
    parse(opt, 'x');
    return true;
}
