#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   toLower() converts letters to lower case; others are unchanged.
 */
_main(args)
{
    return 'ABC'.toLower() == 'abc'
        && 'A1b-C'.toLower() == 'a1b-c'
        && 'ÉÀ'.toLower() == 'éà';
}
