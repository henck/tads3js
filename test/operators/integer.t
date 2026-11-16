#include <tads.h>
#include <bignum.h>
#include "../runtimeError.h"

/*
 *   Integer + - * / % and negation. / truncates toward zero; % has the
 *   sign of the dividend; dividing by zero is error 2008. (Locals are
 *   used so the compiler can't fold the expressions.) Changing a
 *   variable in place (++, +=) doesn't affect copies of its value.
 */

/* Value and precision of a BigNumber, e.g. '3.14 p3'. */
VP(n) { return toString(n) + ' p' + toString(n.getPrecision()); }
obj: object;

_main(args)
{
    local a = -7, b = 2, z = 0, one = 1;
    // Changing a variable doesn't affect copies of its value.
    local x = 5, y = x, lst = [x];
    x++; x += 10; x--; x -= 3;
    return x == 12 && y == 5 && lst == [5]
        && a + b == -5 && a - b == -9 && a * b == -14
        && a / b == -3 && a % b == -1
        && 7 / -b == -3 && 7 % -b == 1
        && -a == 7
        && one / b == 0
        && errnoOf({: one / z }) == 2008
        && errnoOf({: one % z }) == 2008;
}
