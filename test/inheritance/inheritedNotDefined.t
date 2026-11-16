#include <tads.h>
#include "../runtimeError.h"

/*
 *   When there's nothing to inherit, inherited() invokes propNotDefined
 *   (if it's defined and exported), with the property and the arguments;
 *   otherwise the result is nil.
 */
property propNotDefined;
export propNotDefined;

class Base: object
    propNotDefined(prop, [args]) { return [prop, args.length()]; }
;
class Sub: Base
    foo(a, b) { return inherited(a, b); }
;
class Plain: object
    foo() { return inherited(); }
;

_main(args)
{
    local s = new Sub(), p = new Plain();
    return s.foo(1, 2) == [&foo, 2] && s.bar == [&bar, 0] && p.foo() == nil;
}
