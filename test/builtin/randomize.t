#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   randomize(nil) returns the RNG state; randomize(state) restores it,
 *   and randomize(id, seed) seeds a generator, so rand() sequences can be
 *   repeated.
 */

seq() { return List.generate({i: rand(1000000)}, 8); }

_main(args)
{
    local st = randomize(nil);
    local a = seq();
    randomize(st);
    local b = seq();
    randomize(RNG_LCG, 42);
    local c = seq();
    randomize(RNG_LCG, 42);
    local d = seq();
    randomize(RNG_MT19937, 'seed');
    local e = seq();
    randomize(RNG_MT19937, 'seed');
    local f = seq();
    randomize(RNG_ISAAC, 'seed');
    local g = seq();
    randomize(RNG_ISAAC, 'seed');
    local h = seq();
    randomize();
    return a == b && c == d && e == f && g == h && c != e;
}
