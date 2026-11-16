#include "grammar.h"

/*
 *   parseTokens(tokenList, dict) returns a match tree for each way the
 *   production matches the whole token list (or up to a '*'). Each match
 *   object has the '->' properties set (to the token value, or the
 *   sub-production's match object), firstTokenIndex and lastTokenIndex
 *   (tokens skipped by '*' don't count; for an empty match at token
 *   position n from 0, they're n+2 and n+1), tokenList, and
 *   tokenMatchList (for each token matched, the comparator's match value
 *   if it matched a literal, or nil). Without a comparator, literals match
 *   exactly. Left-recursive alternatives work.
 */

book: object noun = 'book' 'box';
red: object adjective = 'red' 'big';
both: object noun = 'red';

grammar cmd(take): 'take' np->obj_ : object;
grammar cmd(takeall): 'take' 'all' : object;
grammar cmd(drop): 'drop' np->obj_ * : object;
grammar np(noun): noun->n_ : object;
grammar np(adj): adjective->a_ np->np_ : object;
grammar np(list): np->a_ 'and' np->b_ : object;
grammar np(num): tokInt->i_ : object;
grammar opt(e): : object;
grammar opt(x): 'x' opt->o_ : object;
grammar cmd2(t): 'look' opt->o_ : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    parse(cmd, 'take book');
    parse(cmd, 'take red book');
    parse(cmd, 'take all');
    parse(cmd, 'take red');
    parse(cmd, 'take book and box and 3');
    parse(cmd, 'drop book now please');
    parse(cmd, 'TAKE BOOK');
    parse(cmd, 'take');
    parse(cmd2, 'look');
    parse(cmd2, 'look x x');
    return true;
}
