#include "grammar.h"

/*
 *   The order of matches from alternatives with the same badness follows
 *   the reference VM.
 */
grammar cmd(a): [badness 5] 'x' : object;
grammar cmd(b): [badness 5] 'x' : object;
grammar cmd(c): [badness 5] tokWord->w_ : object;
grammar two(a): [badness 2] one->o_ : object;
grammar two(b): [badness 2] tokWord->w_ : object;
grammar one(a): [badness 1] 'x' : object;
grammar one(b): 'x' : object;

_main(args)
{
    if(t3GetVMPreinitMode())
        return true;
    cfg.long = nil;
    parse(cmd, 'x');
    parse(two, 'x');
    return true;
}
