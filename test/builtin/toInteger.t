#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   toInteger(val, radix?) converts strings (skipping leading spaces,
 *   with an optional sign, up to the first non-digit), nil/true and
 *   'nil'/'true'. Hex, octal and binary are read as unsigned 32-bit.
 *   A non-string argument is "string value required" (2019).
 */

_main(args)
{
    local n = nil, t = true;
    return toInteger('123') == 123
        && toInteger('  42xyz') == 42
        && toInteger('-17') == -17
        && toInteger('+ 5') == 5
        && toInteger('-A1C', 12) == -121
        && toInteger('ff', 16) == 255
        && toInteger('ffffffff', 16) == -1
        && toInteger('101', 2) == 5
        && toInteger('777', 8) == 511
        && toInteger(n) == 0 && toInteger(t) == 1
        && toInteger(' nil ') == 0 && toInteger(' true ') == 1
        && toInteger(42) == 42
        && toInteger('abc') == 0
        && errnoOf({: toInteger('99999999999') }) == 2023
        && errnoOf({: toInteger([1]) }) == 2019;
}
