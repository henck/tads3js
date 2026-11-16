#include <tads.h>
#include <vector.h>
#include <strbuf.h>

/*
 *   List.generate(func, n) makes a list of n elements from func(index),
 *   or from func() for a zero-argument function.
 */
_main(args)
{
    local a = 0, b = 1;
    local fib = List.generate({: local f = a, a = b, b = f + a, f }, 8);
    return List.generate({x: x * 2}, 10) == [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
        && fib == [0, 1, 1, 2, 3, 5, 8, 13]
        && List.generate({x: x}, 0) == [];
}
