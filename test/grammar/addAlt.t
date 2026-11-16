#include "grammar.h"

/*
 *   addAlt(alt, matchObj, dict?, symtab?) adds alternatives written as in a
 *   grammar statement, looking up symbols in symtab; it sets
 *   matchObj.grammarAltProps to the '->' properties used, and adds literals
 *   to the dictionary (for the production, under miscVocab).
 *   deleteAlt(id, dict?) deletes by grammarTag, match object (or
 *   superclass) or index; clearAlts(dict?) deletes all. A rule that can't
 *   be compiled is error 2315; a bad index is 2015. (Not tested: further
 *   invalid rules, as the reference VM accepts the next invalid rule after
 *   one that fails; nor '*', which it always rejects.)
 */

o1: object noun = 'box' 'key' adjective = 'red';
class DP: DynamicProd;
class DP2: DP;
grammar np(n): noun->n_ : object;
grammar np(a): adjective->a_ np->np_ : object;

_main(args)
{
    // Grammar objects and the dictionary are static: don't change them in
    // preinit (where the compiler also runs _main).
    if(t3GetVMPreinitMode())
        return true;

    local st = new LookupTable();
    st['np'] = np; st['noun'] = &noun; st['adjective'] = &adjective; st['tokInt'] = tokInt;
    st['obj_'] = &obj_; st['x_'] = &x_;
    local g = new GrammarProd(), m1 = new DP(), m2 = new DP2();
    m1.grammarTag = 'one';
    g.addAlt('\'take\' np->obj_ | "get" (\'it\' | np->obj_) | [badness 5] tokInt->x_', m1, gDict, st);
    g.addAlt('<noun adjective>->x_ \'all\'', m2, gDict, st);
    tadsSay(ginfo(g) + '\n');
    tadsSay('props: ' + m1.grammarAltProps.length() + ' ' + yn(m1.grammarAltProps[1] == &obj_)
            + ' ' + m2.grammarAltProps.length() + '\n');
    local w = gDict.findWord('take');
    tadsSay('dict: ' + yn(gDict.isWordDefined('get')) + ' ' + yn(gDict.isWordDefined('all'))
            + ' ' + w.length() + ' ' + yn(w[1] == g) + '\n');
    parse(g, 'take red box');
    parse(g, 'get it');
    parse(g, 'box all');
    parse(g, '42');
    g.deleteAlt('one', gDict);
    tadsSay(ginfo(g) + ' ' + yn(gDict.isWordDefined('take')) + ' ' + yn(gDict.isWordDefined('all')) + '\n');
    g.addAlt('\'drop\' np->obj_', m1, gDict, st);
    g.addAlt('\'drop\' \'it\'', m2, gDict, st);
    g.deleteAlt(1);
    tadsSay(ginfo(g) + '\n');
    g.deleteAlt(DP2, gDict);
    tadsSay(ginfo(g) + ' ' + yn(gDict.isWordDefined('drop')) + '\n');
    g.addAlt('\'a\' | \'b\' | ', m1, gDict, st);
    tadsSay(ginfo(g) + '\n');
    g.clearAlts(gDict);
    tadsSay(ginfo(g) + ' ' + yn(gDict.isWordDefined('a')) + '\n');
    tadsSay('errors: ' + errnoOf({: g.addAlt('foo', m1, gDict, st)})
            + ' ' + errnoOf({: g.deleteAlt(99)}) + '\n');
    return true;
}
