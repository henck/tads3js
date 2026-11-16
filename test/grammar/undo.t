#include "grammar.h"

/*
 *   Changes made with addAlt() and deleteAlt() are undone by undo().
 */

class DP: DynamicProd;
grammar np(n): 'box' : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    local g = new GrammarProd(), st = new LookupTable();
    g.addAlt('\'a\'', new DP(), nil, st);
    savepoint();
    g.addAlt('\'b\'', new DP(), nil, st);
    g.deleteAlt(1);
    tadsSay(ginfo(g) + '\n');
    undo();
    tadsSay(ginfo(g) + '\n');
    return true;
}
