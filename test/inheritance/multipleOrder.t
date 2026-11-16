#include <tads.h>

/*
 *   Multiple inheritance precedence, per the System Manual chapter
 *   "The Object Inheritance Model": the leftmost superclass wins,
 *   except that a class to the right that explicitly overrides the
 *   actual source of the property takes precedence.
 */

// C inherits p via A from X. B is unrelated to X, so leftmost (A -> X) wins.
class X: object p = 'X';
class A: X;
class B: object p = 'B';
class C: A, B;

// Both superclasses define p directly: leftmost wins.
class D1: object p = 'D1';
class D2: object p = 'D2';
class D: D1, D2;

// Diamond: ZB explicitly overrides Z.p, so ZB wins even though
// ZA (which merely inherits Z.p) is further left.
class Z: object p = 'Z';
class ZA: Z;
class ZB: Z p = 'ZB';
class ZC: ZA, ZB;

// Same rules apply to instances created at runtime.
_main(args)
{
    return C.p == 'X'
        && D.p == 'D1'
        && ZC.p == 'ZB'
        && (new C()).p == 'X'
        && (new D()).p == 'D1';
}
