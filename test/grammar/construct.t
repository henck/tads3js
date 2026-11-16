#include "grammar.h"

/*
 *   parseTokens() creates match objects as 'new' does, so the match class's
 *   constructor is called (before the '->' properties are set).
 */
grammar cmd(a): 'take' tokWord->obj_ : object
    construct() { extra = 'constructed'; sawObj = obj_; }
    extra = nil
    sawObj = 'unset'
;

_main(args)
{
    if(t3GetVMPreinitMode())
        return true;
    local m = cmd.parseTokens(toks('take box'), gDict)[1];
    tadsSay(m.extra + ' ' + (m.sawObj == nil ? 'nil' : m.sawObj) + ' ' + m.obj_ + '\n');
    return true;
}
