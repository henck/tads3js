#include <tads.h>

/*
 *   'inherited' continues along the linearized inheritance order of
 *   the original target object, not the defining class's own
 *   superclasses. For AB: A, B (both based on Base) the order is
 *   AB, A, B, Base - so A.p's inherited() goes to B.p, not Base.p.
 */

class Base: object
    p() { return 'Base'; }
;

class A: Base
    p() { return 'A' + inherited(); }
;

class B: Base
    p() { return 'B' + inherited(); }
;

class AB: A, B;

myObj: AB
    p() { return 'obj' + inherited(); }
;

_main(args)
{
    return A.p() == 'ABase'
        && B.p() == 'BBase'
        && AB.p() == 'ABBase'
        && myObj.p() == 'objABBase'
        && (new AB()).p() == 'ABBase';
}
