#include <tads.h>
#include <bignum.h>
#include <strbuf.h>
#include "../runtimeError.h"

/*
 *   From an event script, each kind of input takes the next event of its
 *   kind: inputLine() and inputLineTimeout() take line events (skipping key
 *   events), inputKey() and inputEvent() take key events, inputDialog() a
 *   dialog event (without showing the prompt).
 */

_main(args)
{
    // (The compiler runs _main during preinit, where input would wait for the keyboard.)
    if(t3GetVMPreinitMode())
        return true;
    local a = inputLineTimeout();
    local b = inputLineTimeout(100);
    local c = inputLine();
    local d = inputEvent();
    local e = inputKey();
    local f = inputDialog(InDlgIconNone, 'Pick one', InDlgYesNo, 1, 2);
    local g = inputDialog(InDlgIconNone, 'Pick', ['&Red', '&Green', 'Blue'], 1, 2);
    local h = inputFile('Save to', InFileSave, FileTypeT3Save, 0);
    tadsSay('end\n');
    return a == [InEvtLine, 'first'] && b == [InEvtLine, 'second'] && c == 'third'
        && d == [InEvtKey, 'x'] && e == '[up]' && f == 2 && g == 3
        && h[1] == InFileSuccess && h.length() == 4;
}
