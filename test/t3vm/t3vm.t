#include <tads.h>
#include "../runtimeError.h"

/*
 *   t3GetVMVsn() (we implement version 3.1.3), t3GetVMPreinitMode() (0
 *   when not in preinit), t3DebugTrace() (nil: no debugger), and
 *   t3GetGlobalSymbols() (nil outside preinit without debug symbols).
 *   t3AllocProp() returns new property IDs, which can be used like any
 *   property.
 */
obj: object foo = 1;

_main(args)
{
    if(t3GetVMPreinitMode())
        return true;
    local a = t3AllocProp(), b = t3AllocProp();
    local o = new obj;
    o.(a) = 5;
    return t3GetVMVsn() == 0x030103
        && t3GetVMPreinitMode() == 0
        && t3DebugTrace(T3DebugCheck) == nil && t3DebugTrace(T3DebugBreak) == nil
        && t3GetGlobalSymbols() == nil
        && dataType(a) == TypeProp && a != b && a != &foo
        && o.(a) == 5 && o.propDefined(a) && !o.propDefined(b);
}
