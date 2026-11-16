#include <tads.h>
#include <lookup.h>

/*
 *   The default value (initially nil) is returned for missing keys.
 *   getDefaultValue() / setDefaultValue(val).
 */
_main(args)
{
    local t = new LookupTable();
    local d0 = t.getDefaultValue();
    local m0 = t['missing'];
    t.setDefaultValue(42);
    t['x'] = 1;
    return d0 == nil
        && m0 == nil
        && t.getDefaultValue() == 42
        && t['missing'] == 42
        && t['x'] == 1
        && t.getEntryCount() == 1;
}
