#include <tads.h>
#include <strbuf.h>
#include <vector.h>
#include <lookup.h>
#include "../runtimeError.h"

/*
 *   An iterator visits a list in index order: getNext() returns the next
 *   value, isNextAvailable() tells whether there is one, getCurKey() and
 *   getCurVal() give the current index and value, and resetIterator()
 *   starts over.
 */
_main(args)
{
    local it = ['a', 'b', 'c'].createIterator();
    local s = '';
    local a0 = it.isNextAvailable();
    while(it.isNextAvailable()) {
        local v = it.getNext();
        s += toString(it.getCurKey()) + v + it.getCurVal() + ';';
    }
    local a1 = it.isNextAvailable();
    it.resetIterator();
    local again = it.getNext();
    local e = [].createIterator();
    return s == '1aa;2bb;3cc;'
        && a0 == true && a1 == nil
        && again == 'a'
        && e.isNextAvailable() == nil;
}
