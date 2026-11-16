#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   toTitleCase() converts each character to title case (mostly the
 *   same as upper case; a ligature becomes capital + small).
 *
 *   Not tested: the 'ffi' ligature (U+FB03). The manual says it becomes
 *   'Ffi', but the reference VM gives 'Ff'.
 */
_main(args)
{
    return 'abc'.toTitleCase() == 'ABC'
        && 'ß'.toTitleCase() == 'Ss';
}
