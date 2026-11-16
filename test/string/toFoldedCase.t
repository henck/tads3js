#charset "utf-8"
#include <tads.h>
#include <strbuf.h>
#include <bytearr.h>

/*
 *   toFoldedCase() applies Unicode case folding (e.g. ß -> ss).
 */
_main(args)
{
    return 'abc'.toFoldedCase() == 'abc'
        && 'AbC'.toFoldedCase() == 'abc'
        && 'Weiß'.toFoldedCase() == 'weiss'
        && 'ÉA'.toFoldedCase() == 'éa';
}
