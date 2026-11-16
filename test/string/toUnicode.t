#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   toUnicode(idx?) returns one character's code point (negative idx
 *   counts from the end), or a list of all of them.
 */
_main(args)
{
    return 'ABC'.toUnicode(1) == 65
        && 'ABC'.toUnicode(-1) == 67
        && 'ABC'.toUnicode() == [65, 66, 67]
        && 'é'.toUnicode(1) == 0xe9
        && ''.toUnicode() == [];
}
