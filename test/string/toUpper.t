#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   toUpper() converts letters to upper case; others are unchanged.
 */
_main(args)
{
    return 'abc'.toUpper() == 'ABC'
        && 'a1B-c'.toUpper() == 'A1B-C'
        && 'éà'.toUpper() == 'ÉÀ'
        && 'ß'.toUpper() == 'SS';
}
