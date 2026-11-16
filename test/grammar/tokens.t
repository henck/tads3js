#include "grammar.h"

/*
 *   The token list can be a list or a Vector; each token is a list
 *   [value, type, ...]. A token type matches the token's type. Without a
 *   dictionary, parts of speech never match and literals match exactly.
 *   Each match object's tokenList is the list that was passed.
 */

o1: object noun = 'box';

grammar cmd(a): 'take' noun->n_ : object;
grammar cmd(b): 'take' tokInt->n_ : object;
grammar cmd(c): 'take' tokPunct->n_ 'x' : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    local v = new Vector(toks('take 12'));
    local r = cmd.parseTokens(v, gDict);
    tadsSay('vector: ' + fmt(r[1]) + ' ' + yn(r[1].tokenList == v) + '\n');
    r = cmd.parseTokens([['take', tokWord], [',', tokPunct, 'extra'], ['x', tokWord]], gDict);
    tadsSay('punct: ' + fmt(r[1]) + '\n');
    r = cmd.parseTokens(toks('take box'), nil);
    tadsSay('no dict: ' + r.length() + '\n');
    r = cmd.parseTokens([], gDict);
    tadsSay('empty: ' + r.length() + '\n');
    return true;
}
