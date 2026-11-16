#include <tads.h>
#include <lookup.h>

/*
 *   Storing and retrieving with []. Storing at an existing key replaces
 *   the value. Keys match the way == does, so equal strings and lists
 *   built separately find the same entry, while 1 and '1' differ.
 */
class Thing: object;

_main(args)
{
    local t = new LookupTable();
    local o = new Thing();

    t['ball'] = 'red';
    t['ball'] = 'blue';                 // replaces
    t[1] = 'one';
    t['1'] = 'string one';
    t[[1, 2]] = 'list';
    t[o] = 'object';
    t[&length] = 'prop';
    t[nil] = 'nil key';

    return t.getEntryCount() == 7
        && t['ba' + 'll'] == 'blue'
        && t[1] == 'one'
        && t['1'] == 'string one'
        && t[[1, 1 + 1]] == 'list'
        && t[o] == 'object'
        && t[new Thing()] == nil
        && t[&length] == 'prop'
        && t[nil] == 'nil key';
}
