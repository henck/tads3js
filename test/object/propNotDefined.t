#include <tads.h>

/*
 *   Evaluating a property that an object doesn't define or inherit
 *   yields nil, unless the object defines or inherits propNotDefined,
 *   which is then called with the property and the original arguments.
 */

property propNotDefined;
export propNotDefined;

class Plain: object;

class Catcher: object
    propNotDefined(prop, [args])
    {
        return (prop == &foo ? 'foo' : 'other') + args.length();
    }
;

class SubCatcher: Catcher;

_main(args)
{
    local p = new Plain();
    return Plain.foo == nil
        && p.bar(1, 2) == nil
        && Catcher.foo == 'foo0'
        && Catcher.bar(1, 2) == 'other2'
        && SubCatcher.foo(7) == 'foo1';
}
