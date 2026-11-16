#include "grammar.h"

/*
 *   getGrammarInfo() describes the alternatives with GrammarAltInfo
 *   objects (badness, match object, and a GrammarAltTokInfo for each slot:
 *   target property, GramTokTypeXxx type, and information for the type).
 *   Parenthesized groups are expanded into separate alternatives.
 */

grammar np(n): noun->n_ : object;
grammar cmd(a): 'take' np->obj_ | 'get' ('it' | 'all') : object;
grammar cmd(b): [badness 5] <noun adjective>->x_ tokInt * : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    tadsSay(ginfo(np) + '\n');
    tadsSay(ginfo(cmd) + '\n');
    local info = cmd.getGrammarInfo();
    tadsSay(yn(info[1].gramTokens[2].gramTokenInfo == np) + ' '
            + yn(info[4].gramTokens[2].gramTokenInfo == tokInt) + ' '
            + yn(info[4].gramTokens[1].gramTokenInfo == [&noun, &adjective]) + ' '
            + yn(info[1].gramMatchObj == info[2].gramMatchObj) + '\n');
    return true;
}
