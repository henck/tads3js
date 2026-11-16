/*
 *   Shared definitions for the GrammarProd tests: a dictionary, parts of
 *   speech and token types; a simple tokenizer; and functions to show match
 *   trees. (The tests are built without the library's gramprod.t, so its
 *   classes are defined here.)
 */
#include <tads.h>
#include <gramprod.h>
#include <dict.h>
#include <strcomp.h>
#include "../runtimeError.h"

dictionary gDict;
dictionary property noun, adjective;
enum token tokWord, tokInt, tokPunct;

class GrammarAltInfo: object
    construct(score, badness, matchObj, toks, ...)
    { gramBadness = badness; gramMatchObj = matchObj; gramTokens = toks; }
    gramBadness = 0 gramMatchObj = nil gramTokens = []
;
class GrammarAltTokInfo: object
    construct(prop, typ, info, ...)
    { gramTargetProp = prop; gramTokenType = typ; gramTokenInfo = info; }
    gramTargetProp = nil gramTokenType = nil gramTokenInfo = nil
;
export GrammarAltInfo 'GrammarProd.GrammarAltInfo';
export GrammarAltTokInfo 'GrammarProd.GrammarAltTokInfo';

class DynamicProd: object
    grammarInfo() { return [grammarTag] + grammarAltProps.mapAll({ p: self.(p) }); }
    grammarTag = 'new-alt'
    grammarAltProps = []
;

/* settings: show token indices and match lists in trees? */
cfg: object long = true;

/* a token list from space-separated words: numbers are tokInt, ',' tokPunct */
toks(str)
{
    local l = [];
    foreach(local w in str.split(' '))
        l += [[w, rexMatch('[0-9]+', w) ? tokInt : w == ',' ? tokPunct : tokWord, w]];
    return l;
}

/* a match tree as a string */
fmt(m)
{
    if(m == nil) return 'nil';
    if(dataType(m) == TypeSString) return cfg.long ? '\'' + m + '\'' : m;
    if(dataType(m) != TypeObject) return '?';
    local info = m.grammarInfo();
    local s = cfg.long ? info[1] + '[' + m.firstTokenIndex + '-' + m.lastTokenIndex + ']'
                       : rexReplace('^[a-z0-9]+<lparen>(.*)<rparen>$', info[1], '%1');
    if(cfg.long && m.tokenMatchList != nil)
        s += '{' + m.tokenMatchList.mapAll({x: x == nil ? 'n' : toString(x)}).join(',') + '}';
    s += '(';
    for(local i = 2; i <= info.length(); i++)
        s += (i > 2 ? ' ' : '') + fmt(info[i]);
    return s + ')';
}

/* parse a string and show the matches */
parse(prod, str)
{
    local r = prod.parseTokens(toks(str), gDict);
    tadsSay(str + ': ' + r.length() + '\n');
    foreach(local m in r)
        tadsSay('  ' + fmt(m) + '\n');
}

/* the alternatives of a production, from getGrammarInfo() */
ginfo(prod)
{
    local s = '';
    foreach(local a in prod.getGrammarInfo()) {
        s += '[' + (a.gramBadness ? 'badness ' + a.gramBadness + ': ' : '');
        for(local i = 1; i <= a.gramTokens.length(); i++) {
            local t = a.gramTokens[i];
            local info = t.gramTokenInfo;
            s += (i > 1 ? ' ' : '') + t.gramTokenType + ':'
                + (dataType(info) == TypeSString ? '\'' + info + '\''
                   : dataType(info) == TypeList ? 'list' + info.length()
                   : dataType(info) == TypeObject ? 'obj'
                   : dataType(info) == TypeProp ? 'prop'
                   : dataType(info) == TypeEnum ? 'enum' : 'nil')
                + (t.gramTargetProp != nil ? '->prop' : '');
        }
        s += ']';
    }
    return s;
}

/* a truth value as a string */
yn(x) { return x ? 'yes' : 'no'; }
