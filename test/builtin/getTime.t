#include <tads.h>
#include <vector.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   getTime() returns [year, month, monthDay, weekDay, yearDay, hour,
 *   minute, second, timer]; getTime(GetTimeTicks) returns milliseconds
 *   since a zero point.
 */

_main(args)
{
    local t = getTime();
    local d = getTime(GetTimeDateAndTime);
    local a = getTime(GetTimeTicks);
    local b = getTime(GetTimeTicks);
    return t.length() == 9 && d.length() == 9
        && t[1] >= 2020
        && t[2] >= 1 && t[2] <= 12
        && t[3] >= 1 && t[3] <= 31
        && t[4] >= 1 && t[4] <= 7
        && t[5] >= 1 && t[5] <= 366
        && t[6] >= 0 && t[6] <= 23
        && t[9] > 1600000000
        && dataType(a) == TypeInt && a >= 0 && b >= a;
}
