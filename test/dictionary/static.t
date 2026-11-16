#include <tads.h>
#include <dict.h>

/*
 *   A dictionary defined with the 'dictionary' statement is filled by the
 *   compiler from objects' vocabulary properties and stored in the image
 *   file; it must be loaded with all its associations.
 */
dictionary staticDict;
dictionary property noun, adjective;

lamp: object noun = 'lamp' 'lantern' adjective = 'brass';
key: object noun = 'key' adjective = 'brass';

_main(args)
{
    local brass = staticDict.findWord('brass', &adjective);
    return staticDict.findWord('lamp') == [lamp, 1]
        && staticDict.findWord('lantern', &noun) == [lamp, 1]
        && staticDict.findWord('lantern', &adjective) == []
        && brass.length() == 4
        && brass.indexOf(lamp) != nil
        && brass.indexOf(key) != nil
        && staticDict.isWordDefined('key') == true;
}
