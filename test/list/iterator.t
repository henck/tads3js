#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   List is a Collection: foreach visits the elements in order, and
 *   createIterator()'s getCurKey() gives the index.
 */
_main(args)
{
    local s = '';
    foreach(local x in ['a', 'b', 'c']) s += x;
    local it = ['a', 'b'].createIterator();
    local keys = '';
    while(it.isNextAvailable()) { it.getNext(); keys += toString(it.getCurKey()) + it.getCurVal(); }
    return s == 'abc' && keys == '1a2b';
}
