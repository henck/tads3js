#include <tads.h>
#include <strcomp.h>
#include <dict.h>

/*
 *   A StringComparator used as a Dictionary's comparator: findWord
 *   returns its match flags, and isWordDefined uses it.
 */
property noun;
class Thing: object;

_main(args)
{
    local lamp = new Thing();
    local d = new Dictionary(new StringComparator(6, nil, nil));
    d.addWord(lamp, 'flashlight', &noun);

    local d2 = new Dictionary(nil);
    d2.addWord(lamp, 'Lamp', &noun);
    d2.setComparator(new StringComparator(nil, nil, nil));

    return d.findWord('flashlight') == [lamp, StrCompMatch]
        && d.findWord('FLASHL') == [lamp, StrCompMatch | StrCompCaseFold | StrCompTrunc]
        && d.findWord('flash') == []
        && d.isWordDefined('FlashLig') == true
        && d.isWordDefined('flashlamp') == nil
        && d2.findWord('lamp') == [lamp, StrCompMatch | StrCompCaseFold];
}
