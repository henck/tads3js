#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   rand(n) returns 0..n-1; rand(list) picks an element; rand(a, b, ...)
 *   evaluates one argument; rand(template) builds a random string. (The
 *   values are random, so the tests check ranges and shapes.)
 */

class Counter: object n = 0;

_main(args)
{
    local ok = true;
    for(local i = 0; i < 200; i++) {
        local r = rand(10);
        if(dataType(r) != TypeInt || r < 0 || r > 9) ok = nil;
        if(['a', 'b', 'c'].indexOf(rand(['a', 'b', 'c'])) == nil) ok = nil;
    }
    local c = new Counter();
    for(local i = 0; i < 50; i++) rand(c.n += 1, c.n += 100);
    local evaluatedOne = (c.n % 100 + c.n / 100 == 50);
    return ok && evaluatedOne
        && rand(1) == 0
        && rexMatch('<digit>{3}$', rand('ddd')) == 3
        && rexMatch('[a-z]{2}[A-Z]{2}$', rand('aaAA')) == 4
        && rexMatch('[x-z]{4}$', rand('[x-z]{4}')) == 4
        && rand('"ab"{2}') == 'abab'
        && rand('%%') == '%'
        && ['ab', 'cd'].indexOf(rand('"ab"|"cd"')) != nil
        && rand('d?').length() <= 1
        && rand('d{2,4}').length() >= 2;
}
