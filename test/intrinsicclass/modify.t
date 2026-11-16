#include <tads.h>
#include "../runtimeError.h"

/*
 *   'modify' adds methods to intrinsic classes. They apply to instances of
 *   the class and its subclasses (and constant lists and strings), after
 *   the native methods (which can't be overridden); a modification of
 *   Object applies to all objects. Modifications stack, and inherited()
 *   reaches the previous one.
 */
modify List
    second() { return self[2]; }
    describe() { return 'list'; }
;
modify List
    describe() { return 'more ' + inherited(); }
;
modify Collection
    kind() { return 'collection'; }
    length() { return -1; }
;
modify String
    shout() { return toUpper() + '!'; }
;
modify Object
    everywhere() { return 'object'; }
;
class Thing: object;

_main(args)
{
    local l = [1, 2, 3], v = new Vector([4, 5]);
    return l.second() == 2 && [7, 8].second() == 8
        && l.describe() == 'more list'
        && l.kind() == 'collection' && v.kind() == 'collection'
        && l.length() == 3
        && 'hi'.shout() == 'HI!'
        && new Thing().everywhere() == 'object' && l.everywhere() == 'object'
        && v.propDefined(&kind);
}
