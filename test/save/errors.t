#include <tads.h>
#include <dict.h>
#include <strbuf.h>
#include <bytearr.h>
#include "../runtimeError.h"

/*
 *   restoreGame() of a file that isn't a saved state is error 1201, of
 *   a missing file 103; saveGame() to a file that can't be created is 104;
 *   a nil file name is "bad value for built-in function" (2306).
 */

class Foo: object a = 1;
class Bar: object;
transient tobj: object t = 1;
sobj: object s = 1 ref = nil;

_main(args)
{
    return errnoOf({: restoreGame('test.t3') }) == 1201
        && errnoOf({: restoreGame('missing.sav') }) == 103
        && errnoOf({: saveGame('nodir/test.sav') }) == 104
        && errnoOf({: saveGame(nil) }) == 2306
        && errnoOf({: restoreGame(nil) }) == 2306;
}
